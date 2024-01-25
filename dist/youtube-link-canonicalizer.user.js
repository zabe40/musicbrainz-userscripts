// ==UserScript==
// @name          MusicBrainz Youtube Link Canonicalizer
// @version       2024-01-25_1
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Correct youtube @username artist links to channel IDs
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-youtube-link-canonicalizer
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/youtube-link-canonicalizer.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/youtube-link-canonicalizer.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @match         *://*.musicbrainz.org/artist/*/edit
// ==/UserScript==

(function () {
	'use strict';

	function fixLink(span){
	    const tableRow = span.parentElement.parentElement;
	    if(tableRow.getAttribute("newLink")){
		tableRow.querySelector("td.link-actions > button.edit-item").click();
		return;
	    }
	    GM_xmlhttpRequest({
		url: tableRow.querySelector("td > a").href,
		onload: function(response){
		    if(!((200 <= response.status) && (response.status <= 299))){
			throw new Error(`HTTP error! Status: ${response.status}`);
		    }
		    const html = response.responseText;
		    const parser = new DOMParser();
		    let doc = parser.parseFromString(html, "text/html");
		    const newLink = doc.querySelector("link[rel=\"canonical\"]").href;
		    tableRow.setAttribute("newLink", newLink);
		    const observer = new MutationObserver(function(mutations){
			mutations.forEach(function(mutation){
			    console.log(mutation);
			    if(mutation.addedNodes.length > 0
			       && mutation.addedNodes.item(0).querySelector("div.dialog-content")){
				setReactInputValue(document.querySelector("div.dialog-content input.raw-url"), newLink);
				// document.querySelector("div.dialog-content button.positive").click();

				// this second observer is needed to catch dialog popups after the first one
				const observer = new MutationObserver(function(mutations){
				    mutations.forEach(function(mutation){
					console.log(mutation);
					if(mutation.addedNodes.length > 0
					   && mutation.addedNodes.item(0).querySelector("div.dialog-content")){
					    setReactInputValue(document.querySelector("div.dialog-content input.raw-url"), newLink);
					    // document.querySelector("div.dialog-content button.positive").click();
					}
				    });
				});
				observer.observe(document.querySelector("#url-input-popover-root"), { childList: true});
			    }
			});
		    });
		    observer.observe(document.body, { childList: true});
		    tableRow.querySelector("td.link-actions > button.edit-item").click();
		}});
	}
	function addFixerUpperButton(currentSpan){
	    const tableRow = currentSpan.parentElement.parentElement;
	    if(tableRow.querySelector("a.url").href.match("^https://youtube.com/channel/")){
		return;
	    }
	    let button = document.createElement('button');
	    button.addEventListener("click", (function(){fixLink(currentSpan);}));
	    button.type = 'button';
	    button.innerHTML = "Canonicalize URL";
	    button.className = 'styled-button';
	    button.style.float = 'right';

	    let td = document.createElement('td');
	    td.appendChild(button);
	    currentSpan.parentElement.parentElement.appendChild(td);
	}
	const target = document.querySelector("#external-links-editor-container");
	const observer = new MutationObserver(function(mutations){
	    mutations.forEach(function(mutation){
		if(mutation.addedNodes.length > 0
		   && mutation.addedNodes.item(0).id == "external-links-editor"){
		    document.querySelectorAll(".youtube-favicon")
			.forEach(addFixerUpperButton);
		}
	    });
	});
	observer.observe(target, { childList: true});

})();
