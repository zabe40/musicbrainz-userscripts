// ==UserScript==
// @name          MusicBrainz Youtube Link Canonicalizer
// @version       2024-01-29
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Correct youtube @username artist links to channel IDs
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-youtube-link-canonicalizer
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/youtube-link-canonicalizer.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/youtube-link-canonicalizer.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @match         *://*.musicbrainz.org/artist/*/edit*
// @match         *://*.musicbrainz.org/artist/create*
// @match         *://*.musicbrainz.org/dialog*
// ==/UserScript==

(function () {
	'use strict';

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

	/**
	 * Returns the first element that is a descendant of node that matches selectors.
	 * @param {string} selectors 
	 * @param {ParentNode} node 
	 */
	function qs(selectors, node = document) {
		return node.querySelector(selectors);
	}

	/**
	 * Adds the given message and a footer for the active userscript to the edit note.
	 * @param {string} message Edit note message.
	 */
	function addMessageToEditNote(message) {
		/** @type {HTMLTextAreaElement} */
		const editNoteInput = qs('#edit-note-text, .edit-note');
		const previousContent = editNoteInput.value.split(editNoteSeparator);
		setReactTextareaValue(editNoteInput, buildEditNote(...previousContent, message));
	}

	/**
	 * Builds an edit note for the given message sections and adds a footer section for the active userscript.
	 * Automatically de-duplicates the sections to reduce auto-generated message and footer spam.
	 * @param {...string} sections Edit note sections.
	 * @returns {string} Complete edit note content.
	 */
	function buildEditNote(...sections) {
		sections = sections.map((section) => section.trim());

		if (typeof GM_info !== 'undefined') {
			sections.push(`${GM_info.script.name} (v${GM_info.script.version}, ${GM_info.script.namespace})`);
		}

		// drop empty sections and keep only the last occurrence of duplicate sections
		return sections
			.filter((section, index) => section && sections.lastIndexOf(section) === index)
			.join(editNoteSeparator);
	}

	const editNoteSeparator = '\n—\n';

	function fetchURL(url, options){
	    return new Promise((resolve, reject) => {
		GM_xmlhttpRequest({
		    url: url,
		    onload: function(response){
			if((200 <= response.status) && (response.status <= 299)){
			    resolve(response);
			}else {
			    reject({reason: 'httpError', response: response});
			}
		    },
		    onabort: function(...errors){
			reject({reason: 'abort', info: errors});
		    },
		    onerror: function(...errors){
			reject({reason: 'error', info: errors});
		    },
		    ontimeout: function(...errors){
			reject({reason: 'timeout', info: errors});
		    },
		    ...options,
		});
	    });
	}

	function displayError(tableRow, message){
	    let errorMessage = tableRow.querySelector("p.canonicalizer-error"); 
	    if(!errorMessage){
		errorMessage = document.createElement("p");
		errorMessage.className = "error canonicalizer-error";
		tableRow.querySelector("a.url").insertAdjacentElement("afterend", errorMessage);
	    }
	    errorMessage.textContent = message;
	}

	function clearError(tableRow){
	    let p = tableRow.querySelector("p.canonicalizer-error");
	    if(p){
		p.remove();
	    }
	}

	function fixLink(span){
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
	    fetchURL(tableRow.querySelector("td > a").href)
		.then(function(response){
		    clearError(tableRow);
		    const html = response.responseText;
		    const parser = new DOMParser();
		    let doc = parser.parseFromString(html, "text/html");
		    tableRow.setAttribute("oldLink", tableRow.querySelector("td > a").href);
		    tableRow.setAttribute("newLink", doc.querySelector("link[rel=\"canonical\"]").href);
		    tableRow.querySelector("td.link-actions > button.edit-item").click();
		})
		.catch(function(error){
		    console.warn(error);
		    let message = "";
		    switch (error.reason){
		    case 'abort':
			message = "The request was aborted.";
			break;
		    case 'error':
			message = "There was an error with the request. See the console for more details.";
			break;
		    case 'timeout':
			message = "The request timed out.";
			break;
		    case 'httpError':
			message = `HTTP error! Status: ${error.response.status}`;
			break;
		    default:
			message = "There was an error. See the console for more details.";
		    }
		    displayError(tableRow, message);
		    observer.disconnect();
		})
		.finally(function(){
		    tableRow.querySelector(".canonicalizer-button").disabled = false;
		});
	    tableRow.querySelector(".canonicalizer-button").disabled = true;
	    clearError(tableRow);
	}

	function addFixerUpperButton(currentSpan){
	    const tableRow = currentSpan.parentElement.parentElement;
	    if(tableRow.querySelector("a.url").href.match("^https://(www.)?youtube\\.com/channel/")
	       || tableRow.querySelector('.canonicalizer-button')){
		return;
	    }
	    let button = document.createElement('button');
	    button.addEventListener("click", (function(){fixLink(currentSpan);}));
	    button.type = 'button';
	    button.innerHTML = "Canonicalize URL";
	    button.className = 'styled-button canonicalizer-button';
	    button.style.float = 'right';

	    let td = document.createElement('td');
	    td.className = "canonicalizer-td";
	    td.appendChild(button);
	    currentSpan.parentElement.parentElement.appendChild(td);
	}

	function runUserscript(){
	    const target = document.querySelector("#external-links-editor-container");
	    const observer = new MutationObserver(function(mutations){
		mutations.forEach(function(mutation){
		    if(mutation.addedNodes.length > 0
		       && (mutation.addedNodes.item(0).id == "external-links-editor"
			   || (mutation.addedNodes.item(0).classList
			       && mutation.addedNodes.item(0).classList.contains("url")
			       && mutation.addedNodes.item(0).href.match("^https?://(www\\.)?youtube\\.com")))){
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
		});
	    });
	    observer.observe(target, { childList: true, subtree:true});
	}

	if(document.location.href
	   .match("^https?://((beta|test)\\.)?musicbrainz\\.org/dialog")){
	    if((new URLSearchParams(document.location.search))
	       .get("path").match("^/artist/create")){
		runUserscript();
	    }
	}else {
	    runUserscript();
	    console.log("runned");
	}

})();
