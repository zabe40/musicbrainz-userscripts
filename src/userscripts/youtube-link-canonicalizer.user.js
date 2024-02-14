import { setReactInputValue} from '@kellnerd/es-utils/dom/react.js';
import { addMessageToEditNote} from '@kellnerd/musicbrainz-scripts/src/editNote.js';
import { extractEntityFromURL} from '@kellnerd/musicbrainz-scripts/src/entity.js';
import { fetchFromAPI} from '@kellnerd/musicbrainz-scripts/src/publicAPI.js';
import { fetchURL} from '../fetch.js';

function displayError(element, error, selector = ""){
    let p = element.querySelector("p.canonicalizer-error");
    if(!p){
        p = document.createElement("p");
        p.className = "error canonicalizer-error";
        p.style.wordBreak = "break-word";
        if(selector){
            element = element.querySelector(selector) || element;
        }
        element.insertAdjacentElement("afterend", p);
    }
    p.textContent = error.message;
}

function clearError(element){
    let p = element.querySelector("p.canonicalizer-error");
    if(p){
        p.remove();
    }
}

function isYoutubeLink(link){
    return link.match("^https://(www.)?youtube\\.com");
}

function isCanonicalYoutubeLink(link){
    return link.match("^https?://(www.)?youtube\\.com/channel/");
}

function getCanonicalizedYoutubeLink(link){
    return fetchURL(link).then((response) => {
        const html = response.responseText;
        const parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        return doc.querySelector("link[rel=\"canonical\"]").href;
    });
}

function fixLinkOnArtistPage(span){
    const tableRow = span.parentElement.parentElement;
    const observer = new MutationObserver(function(mutations, observer){
        mutations.forEach(function(mutation){
            if(mutation.addedNodes.length > 0
               && mutation.addedNodes.item(0).querySelector("div.dialog-content")){
                setReactInputValue(document.querySelector("div.dialog-content input.raw-url"), tableRow.getAttribute("newLink"));
                document.querySelector("div.dialog-content button.positive").click();
                observer.disconnect();
                addMessageToEditNote(tableRow.getAttribute("oldLink")
                                     + " → "
                                     + tableRow.getAttribute("newLink"));
            }
        });
    });
    observer.observe(document.querySelector("#url-input-popover-root") || document.body,
                     { childList: true});
    if(tableRow.getAttribute("newLink")){
        tableRow.querySelector("td.link-actions > button.edit-item").click();
        return;
    }
    tableRow.querySelector(".canonicalizer-button").disabled = true;
    clearError(tableRow);
    getCanonicalizedYoutubeLink(tableRow.querySelector("td > a").href)
        .then(function(canonicalizedLink){
            tableRow.setAttribute("oldLink", tableRow.querySelector("td > a").href);
            tableRow.setAttribute("newLink", canonicalizedLink);
            tableRow.querySelector("td.link-actions > button.edit-item").click();
        })
        .catch(function(error){
            console.warn(error);
            displayError(tableRow, error, "a.url");
            observer.disconnect();
        })
        .finally(function(){
            tableRow.querySelector(".canonicalizer-button").disabled = false;
        });
}

function addFixerUpperButton(currentSpan){
    const tableRow = currentSpan.parentElement.parentElement;
    if(isCanonicalYoutubeLink(tableRow.querySelector("a.url").href)
       || tableRow.querySelector('.canonicalizer-button')){
        return;
    }
    let button = document.createElement('button');
    button.addEventListener("click", (function(){fixLinkOnArtistPage(currentSpan)}));
    button.type = 'button';
    button.innerHTML = "Canonicalize URL";
    button.className = 'styled-button canonicalizer-button';
    button.style.float = 'right';

    let td = document.createElement('td');
    td.className = "canonicalizer-td";
    td.appendChild(button);
    currentSpan.parentElement.parentElement.appendChild(td);
}

function highlightNoncanonicalLinks(){
    document.querySelectorAll(".external_links .youtube-favicon")
        .forEach(function(listItem, currentIndex, listObj){
            const ytLink = listItem.querySelector('a').href;
            if(!isCanonicalYoutubeLink(ytLink)){
                const linkButton = document.createElement('a');
                linkButton.className = "styled-button canonicalizer-button";
                linkButton.style.float = "right";
                linkButton.textContent = "Fix URL";
                const entity = extractEntityFromURL(document.location.href);
                fetchFromAPI(entity.type + "/" + entity.mbid,
                             {"inc": "url-rels"})
                    .then((response) => {
                        let urlID = false;
                        for(const urlObject of response.relations){
                            if(urlObject.url.resource == ytLink){
                                urlID = urlObject.url.id;
                                break;
                            }
                        }
                        linkButton.href = document.location.origin + "/url/" + urlID + "/edit";
                        listItem.appendChild(linkButton);
                    })
                    .catch((error) => {
                        console.error(error);
                        displayError(listItem, error, ".canonicalizer-button");
                    });
            }
        });
}

function runUserscript(){
    highlightNoncanonicalLinks();
    const target = document.querySelector("#external-links-editor-container");
    if(target){
        const observer = new MutationObserver(function(mutations){
            mutations.forEach(function(mutation){
                if(mutation.addedNodes.length > 0
                   && (mutation.addedNodes.item(0).id == "external-links-editor"
                       || (mutation.addedNodes.item(0).classList
                           && mutation.addedNodes.item(0).classList.contains("url")
                           && isYoutubeLink(mutation.addedNodes.item(0).href)))){
                    document.querySelectorAll(".youtube-favicon")
                        .forEach(addFixerUpperButton);
                }
                if(mutation.removedNodes.length > 0
                   && mutation.removedNodes.item(0).classList
                   && mutation.removedNodes.item(0).classList.contains("url")){
                    mutation.target.nextElementSibling.remove();
                    const tableRow = mutation.target.parentElement;
                    tableRow.removeAttribute("oldLink");
                    tableRow.removeAttribute("newLink");
                    clearError(tableRow);
                }
            })
        })
        observer.observe(target, { childList: true, subtree:true});
    }
}

function fixLinkURLEdit(row){
    const urlInput = row.querySelector("input#id-edit-url\\.url");
    const button = row.querySelector("button.canonicalizer-button");
    urlInput.setAttribute("oldLink", urlInput.value);
    button.disabled = true;
    clearError(row);
    getCanonicalizedYoutubeLink(urlInput.value)
        .then((canonicalizedURL) => {
            setReactInputValue(urlInput, canonicalizedURL);
            addMessageToEditNote(urlInput.getAttribute("oldLink")
                                 + " → "
                                 + canonicalizedURL);
        })
        .catch((error) => {
            console.warn(error);
            displayError(row, error, ".canonicalizer-button");
        })
        .finally(() => {
            button.disabled = false;
        });
}

function runOnURLEditPage(){
    const urlInput = document.querySelector("input#id-edit-url\\.url");
    if(!urlInput){
        return;
    }
    if(!isYoutubeLink(urlInput.value) || isCanonicalYoutubeLink(urlInput.value)){
        return;
    }
    const button = document.createElement("button")
    button.type = "button";
    button.textContent = "Canonicalize URL";
    button.className = "styled-button canonicalizer-button";
    button.addEventListener("click", function(){fixLinkURLEdit(urlInput.parentElement)});
    urlInput.insertAdjacentElement("afterend", button);
}

const location = document.location.href;
if(location.match("^https?://((beta|test)\\.)?musicbrainz\\.org/dialog")){
    if((new URLSearchParams(document.location.search))
       .get("path").match("^/artist/create")){
        runUserscript();
    }
}else if(location.match("^https?://((beta|test)\\.)?musicbrainz.org/artist")){
    runUserscript();
}else if(location.match("^https?://((beta|test)\\.)?musicbrainz.org/url")){
    runOnURLEditPage();
}
