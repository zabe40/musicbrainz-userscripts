// ==UserScript==
// @name          MusicBrainz Bandcamp Tag Importer
// @version       2024-02-14
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Easily submit tags on Bandcamp pages to Musicbrainz
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-bandcamp-tag-importer
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/bandcamp-tag-importer.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/bandcamp-tag-importer.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @connect       bandcamp.com
// @match         *://*.musicbrainz.org/release/*
// ==/UserScript==

(function () {
    'use strict';

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

    function displayError(button, error){
        let errorMessage = button.parentElement.querySelector("p.bandcamp-tag-importer-error");
        if(!errorMessage){
            errorMessage = document.createElement("p");
            errorMessage.style.wordBreak = "break-word";
            errorMessage.className = "error bandcamp-tag-importer-error";
            button.insertAdjacentElement("afterend", errorMessage);
        }
        errorMessage.textContent = error.message;
    }

    function clearError(button){
        let p = button.parentElement.querySelector("p.bandcamp-tag-importer-error");
        if(p){
            p.remove();
        }
    }

    function importTags(url, button){
        button.disabled = true;
        clearError(button);
        fetchURL(url)
            .then(function(response){
                const html = response.responseText;
                const parser = new DOMParser();
                let doc = parser.parseFromString(html, "text/html");
                const input = document.querySelector(".tag-input");
                doc.querySelectorAll("a.tag")
                    .forEach((currentAnchor, currentIndex, listObj) => {
                        // on Bandcamp the last tag on an album is a tag
                        // of the city in the artist's profile. this
                        // information is often innaccurate (in the case
                        // of labels with Bandcamp pages) or outdated, and
                        // regardless the information is better
                        // represented via a relationship of some sort
                        if(currentIndex != listObj.length - 1){
                            if(currentAnchor.innerText.includes(",")){
                                // Bandcamp tags can have commas, MusicBrainz tags cannot
                                // see https://bandcamp.com/discover/,
                                alert("The tag ${currentAnchor.innerText} includes a comma, which cannot be part of a tag.\nFor more information, see https://musicbrainz.org/doc/Folksonomy_Tagging.");
                            }
                            if(input.value != ""){
                                input.value += ",";
                            }
                            input.value += currentAnchor.innerText;
                        }
                    });
                button.disabled = false;
                input.focus();
            })
            .catch(function(error){
                console.warn(error);
                displayError(button, error);
            })
            .finally(function(){
                button.disabled = false;
            });
    }

    function addImportTagsButton(currentAnchor, _currentIndex, _listObj){
        let importButton = document.createElement('button');
        importButton.addEventListener("click", (function(){importTags(currentAnchor.href, importButton);}));
        importButton.type = 'button';
        importButton.innerHTML = "Tag";
        importButton.className = 'styled-button';
        importButton.style.float = 'right';
        currentAnchor.parentElement.appendChild(importButton);
    }
    document.querySelectorAll(".bandcamp-favicon > a").forEach(addImportTagsButton);

})();
