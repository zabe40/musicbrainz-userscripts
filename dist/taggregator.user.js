// ==UserScript==
// @name          MusicBrainz Taggregator
// @version       2025.7.29
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Easily submit tags from anywhere to Musicbrainz
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-taggregator
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/taggregator.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/taggregator.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @grant         GM_getValue
// @grant         GM_setValue
// @match         *://*.musicbrainz.org/release/*
// @match         *://*.musicbrainz.org/release-group/*
// @match         *://*.musicbrainz.org/artist/*
// @match         *://*.musicbrainz.org/work/*
// @match         *://*.musicbrainz.eu/release/*
// @match         *://*.musicbrainz.eu/release-group/*
// @match         *://*.musicbrainz.eu/artist/*
// @match         *://*.musicbrainz.eu/work/*
// ==/UserScript==

(function () {
  'use strict';

  var img$2 = "data:image/svg+xml,%3csvg version='1.1' x='0px' y='0px' viewBox='0 0 41.799999 41.799999' xml:space='preserve' width='41.799999' height='41.799999' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3cpolygon points='50%2c42.9 36.1%2c29.1 29.1%2c36.1 42.9%2c50 29.1%2c63.9 36.1%2c70.9 50%2c57.1 63.9%2c70.9 70.9%2c63.9 57.1%2c50 70.9%2c36.1 63.9%2c29.1 ' transform='translate(-29.1%2c-29.1)' /%3e%3c/svg%3e";
    var errorIcon = img$2;

  var img$1 = "data:image/svg+xml,%3csvg version='1.1' x='0px' y='0px' viewBox='0 0 511.97501 117.746' enable-background='new 0 0 512 512' xml:space='preserve' width='511.97501' height='117.746' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3crect x='0' y='0' width='511.97501' height='117.746' /%3e%3c/svg%3e";
    var siteUnsupportedIcon = img$1;

  var img = "data:image/svg+xml,%3csvg version='1.1' x='0px' y='0px' viewBox='0 0 100 75.289574' xml:space='preserve' width='100' height='75.289574' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3cpolygon points='44%2c69.5 75.9%2c37.6 68.8%2c30.5 44%2c55.3 31.2%2c42.6 24.1%2c49.6 ' transform='matrix(1.9305019%2c0%2c0%2c1.9305019%2c-46.525096%2c-58.880308)' /%3e%3c/svg%3e";
    var successIcon = img;

  // Adapted from https://stackoverflow.com/a/46012210

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

  /**
   * Sets the value of an input element which has been manipulated by React.
   * @param {HTMLInputElement} input 
   * @param {string} value 
   */
  function setReactInputValue(input, value) {
  	nativeInputValueSetter.call(input, value);
  	input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

  /**
   * Sets the value of a textarea input element which has been manipulated by React.
   * @param {HTMLTextAreaElement} input 
   * @param {string} value 
   */
  function setReactTextareaValue(input, value) {
  	nativeTextareaValueSetter.call(input, value);
  	input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function fetchURL(url, options = {}){
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

  function fetchBandcampTags(url, entityType){
      return fetchAsHTML(url)
          .then((html) => {
              let results = [];
              const hasLocation = html.querySelector(".location").textContent != "";
              html.querySelectorAll("a.tag")
                  .forEach((currentAnchor, currentIndex, listObj) => {
                      // on Bandcamp the last tag on an album is a tag
                      // of the location in the artist's profile (if the
                      // artist has included this in their profile).
                      // this information is often innaccurate (in the
                      // case of labels with Bandcamp pages) or
                      // outdated, and regardless the information is
                      // better represented via a relationship of some
                      // sort
                      if(!hasLocation || (currentIndex != listObj.length - 1)){
                          results.push(currentAnchor.innerText);
                      }
                  });
              return results;
          });
  }

  const bandcamp = { domain: "bandcamp.com",
                            fetchTags: fetchBandcampTags,
                            supportedTypes: ["release"]};

  function fetchDiscogsTags(url, entityType){
      let urlObj = new URL(url);
      let path = urlObj.pathname.split('/');
      let APIURL = "https://api.discogs.com/";
      APIURL += path[1] + "s/" + path[2];
      const headers = new Headers();
      headers.append("User-Agent","Taggregator Userscript/" + GM_info.script.version + " +" + GM_info.script.homepageURL);
      headers.append("Accept", "application/vnd.discogs.v2.html+json");
      return fetch(APIURL,{headers: headers})
          .then((response) => response.json())
          .then((data) => data.genres.concat(data.styles));
  }

  const discogs = { domain: "discogs.com",
                           fetchTags: fetchDiscogsTags,
                           supportedTypes: ["release-group","release"]};

  const apiUrl = "http://www.wikidata.org/wiki/Special:EntityData/";
  const fetchOptions = {headers: {"User-Agent": "Taggregator Userscript/" + GM_info.script.version + " +" + GM_info.script.homepageURL,
                                      "Accept": "application/json",
                                      "Accept-Encoding": "gzip,deflate",},
                        responseType: 'json',};

  function fetchWikidataTags(url, entityType){
      let urlObj = new URL(url);
      let entityID = urlObj.pathname.split('/')[2];
      return fetchURL(apiUrl + entityID, fetchOptions)
          .then((json) => {
              const claims = json.response.entities[entityID].claims;
              let promises = [];
              if(claims.P136){
                  for(const genre of claims.P136){
                      let genreID = genre.mainsnak.datavalue.value.id;
                      promises.push(fetchWikidataGenreName(genreID));
                  }
              }
              return Promise.allSettled(promises).then((results) => {
                  let genres = [];
                  for (const result of results){
                      if(result.status == "fulfilled"){
                          genres.push(result.value);
                      }
                  }
                  return genres;
              });
          });
  }

  function fetchWikidataGenreName(genreID){
      const gmNamespace = "WikidataGenreNameCache:";
      const cached = GM_getValue(gmNamespace + genreID);
      if(cached){
          return Promise.resolve(cached);
      }else {
          return fetchURL(apiUrl + genreID, fetchOptions)
              .then((json) => {
                  const name = json.response.entities[genreID].labels.en.value;
                  GM_setValue(gmNamespace + genreID, name);
                  return name;
              });
      }
  }

  const wikidata = { domain: "wikidata.org",
                            fetchTags: fetchWikidataTags,
                            supportedTypes: ["artist", "release-group","release","work"]};

  const sites = [bandcamp, discogs, wikidata];

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
  padding-right: ${iconContainerSize}px;
  position: relative;
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

      const host = getHostFromListItem(listItem);
      container.title = `loading tags from ${host}`;
      
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

  function displaySuccessIcon(listItem, tags){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      container.title = `loaded tags from ${host}: ${tags.toString()}`;
      
      container.innerHTML = decodeURIComponent(successIcon.substring(SVGPreambleLength));
      container.firstChild.setAttribute("class", "taggregator-status-icon taggregator-success-icon");
  }

  function displayErrorIcon(listItem, error){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      container.title = `${host}: ${error.message}`;
      
      container.innerHTML = decodeURIComponent(errorIcon.substring(SVGPreambleLength));
      container.firstChild.setAttribute("class", "taggregator-status-icon taggregator-error-icon");
  }

  function displaySiteNotSupportedIcon(listItem, entityType){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      let tooltip = `${host} not supported`;
      if(entityType){
          tooltip += ` for ${entityType} pages`;
      }
      container.title = tooltip;

      container.innerHTML = decodeURIComponent(siteUnsupportedIcon.substring(SVGPreambleLength));
      container.firstChild.setAttribute("class", "taggregator-status-icon taggregator-unsupported-icon");
  }

  function URLHostname(url){
      const urlObj = new URL(url);
      return urlObj.hostname;
  }

  function getHostFromListItem(li){
      return URLHostname(li.querySelector("a").href);
  }

  function matchesDomain(url, domain){
      return URLHostname(url).match(new RegExp("^(.+\\.)?" + domain));
  }

  function addTagsAndFocus(tags){
      const input = document.querySelector("input.tag-input");
      const textarea = document.querySelector("#tag-form textarea");
      let tagString = "";
      for(const tag of tags){
          tagString += tag + ",";
      }
      if(input){
          setReactInputValue(input, input.value + tagString);
          document.querySelector("#tag-form button").click();
          input.focus();
      }else if(textarea){
          setReactTextareaValue(textarea, textarea.value + tagString);
          document.querySelector("#tag-form button").click();
          textarea.focus();
      }
  }

  function importAllTags(){
      const allLinkListItems = document.querySelectorAll("ul.external_links li");
      let promises = [];
      const button = document.querySelector("#taggregator-import-button");
      button.disabled = true;
      const entityType = document.location.pathname.split('/')[1];
      for(const linkListItem of allLinkListItems){
          const url = linkListItem.querySelector("a").href;
          let matchedSite;
          for(const site of sites){
              if(matchesDomain(url, site.domain)){
                  matchedSite = site;
              }
          }
          if(matchedSite && matchedSite.supportedTypes.includes(entityType)){
              displayLoadingIcon(linkListItem);
              promises.push(matchedSite.fetchTags(url, entityType)
                            .then((tags) => {
                                displaySuccessIcon(linkListItem, tags);
                                return tags;
                            })
                            .catch((error) => {
                                console.error(error);
                                displayErrorIcon(linkListItem, error);
                                // throw the error again since we need
                                // to know if its an error later
                                throw error;
                            }));
          }else if(matchedSite){
              displaySiteNotSupportedIcon(linkListItem, entityType);
          }
          else {
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
          addTagsAndFocus(tags);
      });
  }

  function addImportTagsButton(){
      let linksHeader = document.querySelector("#sidebar h2.external-links");
      if(!linksHeader){
          console.log("Taggregator bailing: entity has no links");
          return;
      }

      const input = document.querySelector("input.tag-input");
      const textarea = document.querySelector("#tag-form textarea");
      if(!input && ! textarea){
          console.log("Taggregator bailing: not logged in");
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
