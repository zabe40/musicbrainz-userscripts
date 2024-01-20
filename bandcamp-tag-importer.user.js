// ==UserScript==
// @name         MusicBrainz Bandcamp Tag Importer
// @namespace    https://github.com/zabe40
// @version      2024-01-19
// @description  Easily submit tags on Bandcamp pages to Musicbrainz
// @author       zabe
// @homepage     https://github.com/zabe40/musicbrainz-userscripts
// @updateURL    https://raw.github.com/zabe40/musicbrainz-userscripts/main/bandcamp-tag-importer.user.js
// @downloadURL  https://raw.github.com/zabe40/musicbrainz-userscripts/main/bandcamp-tag-importer.user.js
// @supportURL   https://github.com/zabe40/musicbrainz-userscripts/issues
// @match        *://*.musicbrainz.org/release/*
// @connect      bandcamp.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    function importTags(url){
	GM_xmlhttpRequest({
	    url: url,
	    onload: function(response){
		if(!((200 <= response.status) && (response.status <= 299))){
		    throw new Error(`HTTP error! Status: ${response.status}`);
		}
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
		input.focus();
	    }
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
