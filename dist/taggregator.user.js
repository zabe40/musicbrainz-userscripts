// ==UserScript==
// @name          MusicBrainz Taggregator
// @version       2024-03-06_1
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Easily submit tags from anywhere to Musicbrainz
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-taggregator
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/taggregator.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/taggregator.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @match         *://*.musicbrainz.org/release/*
// ==/UserScript==

(function () {
  'use strict';

  var img$2 = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' x='0px' y='0px' viewBox='0 0 100 125' style='enable-background:new 0 0 100 100%3b' xml:space='preserve'%3e %3cpolygon points='70.9%2c63.9 57.1%2c50 70.9%2c36.1 63.9%2c29.1 50%2c42.9 36.1%2c29.1 29.1%2c36.1 42.9%2c50 29.1%2c63.9 36.1%2c70.9 50%2c57.1 63.9%2c70.9 '/%3e %3ctext x='0' y='115' fill='black' font-size='5px' font-weight='bold' font-family=''Helvetica Neue'%2c Helvetica%2c Arial-Unicode%2c Arial%2c Sans-serif'%3eCreated by mikicon%3c/text%3e %3ctext x='0' y='120' fill='black' font-size='5px' font-weight='bold' font-family=''Helvetica Neue'%2c Helvetica%2c Arial-Unicode%2c Arial%2c Sans-serif'%3efrom the Noun Project%3c/text%3e%3c/svg%3e";
    var errorIcon = img$2;

  var img$1 = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' x='0px' y='0px' viewBox='0 0 512 640' enable-background='new 0 0 512 512' xml:space='preserve'%3e %3crect x='0.013' y='197.127' width='511.975' height='117.746'/%3e %3ctext x='0' y='527' fill='black' font-size='5px' font-weight='bold' font-family=''Helvetica Neue'%2c Helvetica%2c Arial-Unicode%2c Arial%2c Sans-serif'%3eCreated by Hassan ali%3c/text%3e %3ctext x='0' y='532' fill='black' font-size='5px' font-weight='bold' font-family=''Helvetica Neue'%2c Helvetica%2c Arial-Unicode%2c Arial%2c Sans-serif'%3efrom the Noun Project%3c/text%3e%3c/svg%3e";
    var siteUnsupportedIcon = img$1;

  var img = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' x='0px' y='0px' viewBox='0 0 100 125' style='enable-background:new 0 0 100 100%3b' xml:space='preserve'%3e %3cg%3e %3cpolygon points='75.9%2c37.6 68.8%2c30.5 44%2c55.3 31.2%2c42.6 24.1%2c49.6 44%2c69.5 '/%3e %3c/g%3e %3ctext x='0' y='115' fill='black' font-size='5px' font-weight='bold' font-family=''Helvetica Neue'%2c Helvetica%2c Arial-Unicode%2c Arial%2c Sans-serif'%3eCreated by mikicon%3c/text%3e %3ctext x='0' y='120' fill='black' font-size='5px' font-weight='bold' font-family=''Helvetica Neue'%2c Helvetica%2c Arial-Unicode%2c Arial%2c Sans-serif'%3efrom the Noun Project%3c/text%3e%3c/svg%3e";
    var successIcon = img;

  function fetchURL(url, options){
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
              url: url,
              onload: function(response){
                  if(400 <= response.status){
                      reject(new Error(`HTTP error! Status: ${response.status}`,
                                       { cause: response}));
                  }else {
                      resolve(response);
                  }
              },
              onabort: function(error){
                  reject(new Error("The request was aborted.",
                                   { cause: error}));
              },
              onerror: function(error){
                  reject(new Error("There was an error with the request. See the console for more details.",
                                   { cause: error}));
              },
              ontimeout: function(error){
                  reject(new Error("The request timed out.",
                                   { cause: error}));
              },
              ...options,
          });
      });
  }

  function fetchAsHTML(url, options){
      return fetchURL(url, options)
          .then((response) => {
              const html = response.responseText;
              const parser = new DOMParser();
              return parser.parseFromString(html, "text/html");
          })
  }

  function fetchBandcampTags(url){
      return fetchAsHTML(url)
          .then((html) => {
              let results = [];
              html.querySelectorAll("a.tag")
                  .forEach((currentAnchor, currentIndex, listObj) => {
                      if(currentIndex != listObj.length - 1){
                          results.push(currentAnchor.innerText);
                      }
                  });
              return results;
          });
  }

  const bandcamp = { domain: "bandcamp.com",
                            fetchTags: fetchBandcampTags,};

  const sites = [bandcamp];

  function fixKeyframes(keyframesArray){
      keyframesArray.sort((a,b) => {
          return a.offset-b.offset;
      });
      // duplicate key frames if needed for offsets 0 & 1
      const hasFrom = keyframesArray[0].offset == 0;
      const hasTo = keyframesArray.at(-1).offset == 1;
      const from = Object.assign({}, keyframesArray[0]);
      const to = Object.assign({}, keyframesArray.at(-1));
      if(hasFrom && !hasTo){
          from.offset = 1;
          keyframesArray.push(from);
      }else if(!hasFrom && hasTo){
          to.offset = 0;
          keyframesArray.unshift(to);
      }else if(!hasFrom && !hasTo){
          from.offset = 0;
          keyframesArray.unshift(from);
          to.offset = 1;
          keyframesArray.push(to);
      }
      return keyframesArray;
  }

  function addCSSRules(){
      const iconContainerSize = 20;
      const sheet = new CSSStyleSheet();
      sheet.replace(`
.taggregator-icon-container {
  float: right;
  padding-right: ${1.5 * iconContainerSize}px;
  position: relative;
  bottom: ${3 * iconContainerSize / 10}px;
}

.taggregator-icon-container > * {
  width: ${iconContainerSize}px;
  height: ${iconContainerSize}px;
}

.taggregator-loading-hexagon {
  position: absolute;
  background-color: #eb743b;
}

.taggregator-status-icon {
  height:${0.75 * iconContainerSize}px;
}

.taggregator-status-icon text {
  visibility: collapse;
}

.taggregator-success-icon {
  fill: green;
}

.taggregator-error-icon {
  fill:red;
}

.taggregator-unsupported-icon {
  fill:grey;
}

`)
          .catch((error) => {
              console.error("Failed to replace styles:", error);
          });
      document.adoptedStyleSheets.push(sheet);
  }

  function getNewIconContainer(listItem){
      let container = listItem.querySelector("div.taggregator-icon-container");
      if(!container){
          container = document.createElement('div');
          container.className = "taggregator-icon-container";
          listItem.appendChild(container);
      }else {
          container.replaceChildren();
      }
      return container;
  }

  function displayLoadingIcon(listItem){
      const container = getNewIconContainer(listItem);
      container.title = "loading tags";
      
      for(let i=0; i < 6; i++){
          let element = document.createElement('div');
          container.appendChild(element);
          element.className = "taggregator-loading-hexagon";
          element.style.transform = "rotate(" + (i * 60) + "deg)";
          
          const smallTriangle = 'polygon(50% 50%, 50% 75%, 71.65% 62.5%)';
          const bigTriangle = 'polygon(50% 50%, 50% 100%, 93.3% 75%)';
          
          element.animate(fixKeyframes([
              { clipPath: smallTriangle, offset: i/6},
              { clipPath: bigTriangle, offset: ((i+1)/6)%1},
              { clipPath: smallTriangle, offset: ((i+2)/6)%1},
          ]),
                          {duration: 3000,
                           iterations: Infinity});
      }

      const placeholder = document.createElement('div');
      container.appendChild(placeholder);
  }

  const SVGPreambleLength = "data:image/svg+xml,".length;

  function displaySuccessIcon(listItem){
      const container = getNewIconContainer(listItem);
      container.title = "successfully loaded tags";
      
      container.innerHTML = decodeURIComponent(successIcon.substring(SVGPreambleLength));
      container.firstChild.setAttribute("class", "taggregator-status-icon taggregator-success-icon");
  }

  function displayErrorIcon(listItem, error){
      const container = getNewIconContainer(listItem);
      container.title = error.message;
      
      container.innerHTML = decodeURIComponent(errorIcon.substring(SVGPreambleLength));
      container.firstChild.setAttribute("class", "taggregator-status-icon taggregator-error-icon");
  }

  function displaySiteNotSupportedIcon(listItem){
      const container = getNewIconContainer(listItem);
      container.title = "site not supported";

      container.innerHTML = decodeURIComponent(siteUnsupportedIcon.substring(SVGPreambleLength));
      container.firstChild.setAttribute("class", "taggregator-status-icon taggregator-unsupported-icon");
  }

  function matchesDomain(url, domain){
      const urlObj = new URL(url);
      return urlObj.hostname.endsWith(domain);
  }

  function addTagsToInputAndFocus(tags){
      const input = document.querySelector("input.tag-input")
            || document.querySelector("#tag-form textarea");
      for(const tag of tags){
          if(input.value != ""){
              input.value += ",";
          }
          input.value += tag;
      }
      input.focus();
  }

  function importAllTags(){
      const allLinkListItems = document.querySelectorAll("ul.external_links li");
      let promises = [];
      const button = document.querySelector("#taggregator-import-button");
      button.disabled = true;
      for(const linkListItem of allLinkListItems){
          const url = linkListItem.querySelector("a").href;
          let matchedSite;
          for(const site of sites){
              if(matchesDomain(url, site.domain)){
                  matchedSite = site;
              }
          }
          if(matchedSite){
              displayLoadingIcon(linkListItem);
              promises.push(matchedSite.fetchTags(url)
                            .then((tags) => {
                                displaySuccessIcon(linkListItem);
                                return tags;
                            })
                            .catch((error) => {
                                console.error(error);
                                displayErrorIcon(linkListItem, error);
                                // throw the error again since we need
                                // to know if its an error later
                                throw error;
                            }));
          }else {
              displaySiteNotSupportedIcon(linkListItem);
          }
      }
      Promise.allSettled(promises).then((results) => {
          button.disabled = false;
          // use a Set since a user can only submit a tag once
          let tags = new Set();
          for(const result of results){
              if(result.status == "fulfilled"){
                  for(const tag of result.value){
                      tags.add(tag);
                  }
              }
          }
          addTagsToInputAndFocus(tags);
      });
  }

  function addImportTagsButton(){
      let linksHeader = document.querySelector("#sidebar h2.external-links");
      if(!linksHeader){
          return;
      }

      addCSSRules();
      
      let importButton = document.createElement('button');
      importButton.addEventListener("click", importAllTags);
      importButton.type = 'button';
      importButton.innerHTML = "Tag From All";
      importButton.id = "taggregator-import-button";
      importButton.className = 'styled-button';
      importButton.style.float = 'right';

      let importDiv = document.createElement("div");
      importDiv.style.display = "flex";
      importDiv.style.justifyContent = "center";
      importDiv.appendChild(importButton);

      linksHeader.insertAdjacentElement("beforebegin", importDiv);
  }


  addImportTagsButton();

})();
