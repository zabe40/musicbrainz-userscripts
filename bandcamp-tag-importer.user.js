// ==UserScript==
// @name         MusicBrainz Bandcamp Tag Importer
// @namespace    https://github.com/zabe40
// @version      2024-01-16
// @description  Easily submit tags on Bandcamp pages to Musicbrainz
// @author       zabe
// @homepage     https://github.com/zabe40/musicbrainz-userscripts
// @updateURL    https://raw.github.com/zabe40/musicbrainz-userscripts/main/bandcamp-tag-importer.user.js
// @downloadURL  https://raw.github.com/zabe40/musicbrainz-userscripts/main/bandcamp-tag-importer.user.js
// @supportURL   https://github.com/zabe40/musicbrainz-userscripts/issues
// @match        http*://*.musicbrainz.org/release/*
// @connect      bandcamp.com
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function() {
    'use strict';
    function importTags(url){
	GM.xmlHttpRequest({ url: url})
	    .then((response) => {
		if((200 <= response.status) && (response.status <= 299)){
		    return response.responseText;
		}
		throw new Error(`HTTP error! Status: ${response.status}`);
	    }).then((html) => {
		const parser = new DOMParser();
		let doc = parser.parseFromString(html, "text/html");
		const input = document.querySelector(".tag-input");
		doc.querySelectorAll("a.tag").forEach((currentAnchor, currentIndex, listObj) => {
		    // on Bandcamp the last tag on an album is a tag
		    // of the city in the artist's profile. this
		    // information is often innaccurate (in the case
		    // of labels with Bandcamp pages) or outdated, and
		    // regardless the information is better
		    // represented via a relationship of some sort
		    if(currentIndex != listObj.length - 1){
			if(input.value != ""){
			    input.value += ",";
			}
			input.value += currentAnchor.innerHTML;
		    }
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
