import errorIcon from '../../assets/errorIcon.svg';
import siteUnsupportedIcon from '../../assets/siteUnsupportedIcon.svg';
import successIcon from '../../assets/successIcon.svg';
import authIcon from '../../assets/authIcon.svg';
import siteDisabledIcon from '../../assets/siteDisabled.svg';
import { setReactInputValue, setReactTextareaValue } from '@kellnerd/es-utils/dom/react.js';
import { fetchAsHTML} from '../fetch.js';
import { bandcamp} from '../taggregator-modules/bandcamp.js';
import { discogs} from '../taggregator-modules/discogs.js';
import { wikidata} from '../taggregator-modules/wikidata.js';
import { appleMusic} from '../taggregator-modules/appleMusic.js';
import { deezer} from '../taggregator-modules/deezer.js';
import { soundcloud} from '../taggregator-modules/soundcloud.js';
import { spotify} from '../taggregator-modules/spotify.js';
import { allmusic} from '../taggregator-modules/allmusic.js';
import { beatport} from '../taggregator-modules/beatport.js';

const sites = [bandcamp, discogs, wikidata, appleMusic, deezer, soundcloud, spotify, allmusic, beatport];

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

div#taggregator-settings details label{
  background-position: 0 2px;
  background-repeat: no-repeat;
  margin-bottom: 2px;
  padding: 4px 0 0 22px;
  min-height: 14px;
}

`)
        .catch((error) => {
            console.error("Failed to replace styles:", error);
        });
    document.adoptedStyleSheets.push(sheet);
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
    container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-success-icon");
}

function displayNeedsAuthIcon(listItem, authenticateFunction){
    const container = getNewIconContainer(listItem);
    const host = getHostFromListItem(listItem);
    container.title = `Click to authenticate with ${host}`;
    container.addEventListener("click", authenticateFunction, {once: true});
    container.innerHTML = decodeURIComponent(authIcon.substring(SVGPreambleLength))
    container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-auth-icon");
}

function displayErrorIcon(listItem, error){
    const container = getNewIconContainer(listItem);

    const host = getHostFromListItem(listItem);
    container.title = `${host}: ${error.message}`;
    
    container.innerHTML = decodeURIComponent(errorIcon.substring(SVGPreambleLength));
    container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-error-icon");
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
    container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-unsupported-icon");
}

function displaySiteDisabledIcon(listItem, site, listenerCallback){
    const container = getNewIconContainer(listItem);

    const host = getHostFromListItem(listItem);
    container.title = `${host} disabled: click to fetch tags anyway`;
    container.innerHTML = decodeURIComponent(siteDisabledIcon.substring(SVGPreambleLength));
    container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-disabled-icon");
    container.addEventListener("click", listenerCallback, {once: true});
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
    const input = document.querySelector("input.tag-input")
    const textarea = document.querySelector("#tag-form textarea");
    let tagString = "";
    for(const tag of tags){
        tagString += tag + ",";
    }
    if(input){
        setReactInputValue(input, input.value + tagString);
        if(GM_getValue("settings:submitTagsAutomatically", true)){
            document.querySelector("#tag-form button").click();
        }
        input.focus();
    }else if(textarea){
        setReactTextareaValue(textarea, textarea.value + tagString);
        if(GM_getValue("settings:submitTagsAutomatically", true)){
            document.querySelector("#tag-form button").click();
        }
        textarea.focus();
    }
}

function hasAncestor(element, ancestor){
    if(element == null){
        return null;
    }else if(element == ancestor){
        return true;
    }else{
        return hasAncestor(element.parentNode, ancestor)
    }
}

function importAllTags(){
    const allLinkListItems = document.querySelectorAll("ul.external_links li");
    let promises = [];
    const button = document.querySelector("#taggregator-import-button");
    button.disabled = true;
    const entityType = document.location.pathname.split('/')[1];
    const ameSidebar = document.querySelector("#ame-sidebar");
    for(const linkListItem of allLinkListItems){
        if(linkListItem.closest("ul[class*=jesus2099_all-links]")){}
        else if(linkListItem.closest("[class*=jesus2099_all-links_wd]")
                && !linkListItem.classList.contains("wikidata-favicon")){}
        else if(ameSidebar && hasAncestor(linkListItem, ameSidebar.parentNode)){}
        else if(linkListItem.querySelector("a") == null){}
        else{
            const url = linkListItem.querySelector("a").href;
            let matchedSite;
            for(const site of sites){
                if(matchesDomain(url, site.domain)){
                    matchedSite = site;
                }
            }
            if(matchedSite && matchedSite.supportedTypes.includes(entityType)){
                if(matchedSite.needsAuthentication && matchedSite.needsAuthentication()){
                    displayNeedsAuthIcon(linkListItem, matchedSite.authenticate);
                }else if(!GM_getValue("settings:enableSite:" + matchedSite.name, true)){
                    displaySiteDisabledIcon(linkListItem, matchedSite, (event) => {
                        matchedSite.fetchTags(url, entityType)
                            .then((tags) => {
                                displaySuccessIcon(linkListItem, tags);
                                let set = new Set(tags.map((tag) => tag.toLowerCase()));
                                return Promise.allSettled(Array.from(set,checkForGenreAlias));
                            })
                            .then((results) => results.filter((result) => result.status == "fulfilled"))
                            .then((successes) => successes.map((success) => success.value))
                            .then((tags) => {
                                addTagsAndFocus(tags);
                            })
                            .catch((error) => {
                                console.error(error);
                                displayErrorIcon(linkListItem, error);
                            })
                    });
                }else{
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
                }
            }else if(matchedSite){
                displaySiteNotSupportedIcon(linkListItem, entityType);
            }else{
                displaySiteNotSupportedIcon(linkListItem);
            }
        }
    }
    Promise.allSettled(promises)
        .then((results) => results.filter((result) => result.status == "fulfilled"))
        .then((successes) => successes.map((success) => success.value))
        .then((tagLists) => {
            // use a Set since a user can only submit a tag once
            let tags = new Set(tagLists.flat().map((tag) => tag.toLowerCase()));
            return Promise.allSettled(Array.from(tags,checkForGenreAlias));
        })
        .then((results) => results.filter((result) => result.status == "fulfilled"))
        .then((successes) => successes.map((success) => success.value))
        .then((tags) => {
            addTagsAndFocus(tags);
            button.disabled = false;
        });
}

function checkForGenreAlias(tag){
    const cacheNamespace = "MusicBrainzTagGenre:";
    const cached = GM_getValue(cacheNamespace + tag);
    const cacheLifetimeDays = 90;
    if(cached){
        if(cached.isGenre){
            return Promise.resolve(cached.value);
        }else if(Date.now() - cached.date < (1000 * 60 * 60 * 24 * cacheLifetimeDays)){
            return Promise.resolve(cached.value);
        }
    }
    const mbUrl = "https://musicbrainz.org/tag/";
    return fetchAsHTML(mbUrl + tag)
        .then((html) => {
            let genre = html.querySelector("a[href^=\"/genre/\"]");
            if(genre){
                GM_setValue(cacheNamespace + tag, { value: genre.textContent,
                                                    isGenre: true,
                                                    date: Date.now()});
                return genre.textContent;
            }else{
                GM_setValue(cacheNamespace + tag, { value: tag,
                                                    isGenre: false,
                                                    date: Date.now()});
                return tag;
            }
        })
        .catch((error) => {
            console.error(error);
            return tag;
        });
}

function addImportTagsButton(){
    let linksHeader = document.querySelector("#sidebar h2.external-links");
    if(!linksHeader){
        console.log("Taggregator bailing: entity has no links");
        return;
    }

    const input = document.querySelector("input.tag-input")
    const textarea = document.querySelector("#tag-form textarea");
    if(!input && ! textarea){
        console.log("Taggregator bailing: not logged in")
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

    let tagForm = document.querySelector("form#tag-form");
    if(tagForm){
        tagForm.insertAdjacentElement("afterend", importDiv);
    }
    linksHeader.insertAdjacentElement("beforebegin", importDiv);
}

function initializeSettings(){
    const sidebar = document.querySelector("div#sidebar");
    if(sidebar){
        const containerDiv = document.createElement('div');
        containerDiv.id = "taggregator-settings";

        const header = document.createElement('h2');
        header.innerText = "Taggregator Settings"
        containerDiv.appendChild(header);

        const fieldSet = document.createElement('fieldset');
        containerDiv.appendChild(fieldSet);

        const label = document.createElement('label');
        label.innerText = "Submit tags automatically"
        fieldSet.appendChild(label);

        const input = document.createElement('input');
        input.type = "checkbox";
        input.id = "taggregator-submit-automatically";
        input.name = "submit-automatically";
        input.defaultChecked = GM_getValue("settings:submitTagsAutomatically", true);
        input.addEventListener('change', (event) => {
            GM_setValue("settings:submitTagsAutomatically", event.target.checked);
        });
        label.insertAdjacentElement("afterbegin",input);

        const details = document.createElement('details');
        containerDiv.appendChild(details);

        const summary = document.createElement('summary');
        summary.innerText = "Enable Sites";
        details.appendChild(summary);

        const enableSitesFieldSet = document.createElement('fieldset');
        details.appendChild(enableSitesFieldSet);

        sites.sort((site1, site2) => site1.name.localeCompare(site2.name));
        for(const site of sites){
            const label = document.createElement('label');
            label.innerText = site.name;
            label.className = site.faviconClass;
            label.style.backgroundRepeat = "no-repeat";
            label.style.paddding = "4px 0 0 22px";

            const siteNameSanitized = site.name.replace(/\W+/,"-").toLowerCase();
            const input = document.createElement('input');
            input.type = "checkbox";
            input.id = "taggregator-enable-" + siteNameSanitized;
            input.name = "enable-" + siteNameSanitized;
            input.defaultChecked = GM_getValue("settings:enableSite:" + site.name, true);
            input.addEventListener('change', (event) => {
                GM_setValue("settings:enableSite:" + site.name, event.target.checked);
            });
            label.insertAdjacentElement("afterbegin", input);
            enableSitesFieldSet.appendChild(label);
            enableSitesFieldSet.appendChild(document.createElement('br'));
        }
        sidebar.insertAdjacentElement("beforeend", containerDiv)
    }
}

const urlParams = new URLSearchParams(window.location.search);
let auth = urlParams.get('taggregator-auth');
for(const site of sites){
    if(auth == site.domain){
        site.redirectHandler()
            .then(() => {
                window.close();
            });
    }
}

addImportTagsButton();
initializeSettings();
