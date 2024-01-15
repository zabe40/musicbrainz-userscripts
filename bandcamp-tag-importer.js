// ==UserScript==
// @name         MusicBrainz Bandcamp Tag Importer
// @namespace    http://tampermonkey.net/
// @version      2024-01-15
// @description  Easily submit tags on Bandcamp pages to Musicbrainz
// @author       zabe
// @match        https://musicbrainz.org/release/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function importTags(url){
	let headers = new Headers();
	headers.append("Access-Control-Allow-Origin", "https://musicbrainz.org");
	headers.append("Referrer-Policy", "");
	const init = {
	    headers: headers,
	    mode: "cors",
	    credentials: "omit"
	};
	const bandcampRequest = new Request(url);
	fetch(bandcampRequest, init)
	    .then((response) => {
		if(!response.ok){
		    throw new Error(`HTTP error! Status: ${response.status}`);
		}
		return response.text();
	    }).then((html) => {
		const parser = new DOMParser();
		let doc = parser.parseFromString(html, "text/html");
		doc.querySelectorAll("a.tag").forEach((currentAnchor) => {
		    const input = document.querySelector(".tag-input").value;
		    if(input.value != ""){
			input.value += ",";
		    }
		    input.value += currentAnchor.innerHTML;
		})
	    });
    }
    function addImportTagsButton(currentAnchor, _currentIndex, _listObj){
	let importButton = document.createElement('button');
	importButton.addEventListener("click", (function(){importTags(currentAnchor.href)}));
	importButton.type = 'button';
	importButton.innerHTML = "Tag";
	importButton.className = 'styled-button';
	importButton.style.float = 'right';
	currentAnchor.parentElement.appendChild(importButton);
    }
    document.querySelectorAll(".bandcamp-favicon > a").forEach(addImportTagsButton);
    
})();
