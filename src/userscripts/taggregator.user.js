import errorIcon from '../../assets/errorIcon.svg';
import siteUnsupportedIcon from '../../assets/siteUnsupportedIcon.svg';
import successIcon from '../../assets/successIcon.svg';
import { bandcamp} from '../taggregator-modules/bandcamp.js';

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
    document.adoptedStyleSheets.push(sheet)
}

function getNewIconContainer(listItem){
    let container = listItem.querySelector("div.taggregator-icon-container")
    if(!container){
        container = document.createElement('div');
        container.className = "taggregator-icon-container";
        listItem.appendChild(container)
    }else{
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
        }else{
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


