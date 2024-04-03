// ==UserScript==
// @name          MusicBrainz Youtube Link Canonicalizer
// @version       2024-04-03
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Correct youtube @username artist links to channel IDs
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-youtube-link-canonicalizer
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/youtube-link-canonicalizer.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/youtube-link-canonicalizer.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @connect       youtube.com
// @connect       musicbrainz.org
// @match         *://*.musicbrainz.org/artist/*
// @match         *://*.musicbrainz.org/event/*
// @match         *://*.musicbrainz.org/label/*
// @match         *://*.musicbrainz.org/place/*
// @match         *://*.musicbrainz.org/series/*
// @match         *://*.musicbrainz.org/url/*
// @match         *://*.musicbrainz.org/dialog*
// @match         *://*.musicbrainz.eu/artist/*
// @match         *://*.musicbrainz.eu/event/*
// @match         *://*.musicbrainz.eu/label/*
// @match         *://*.musicbrainz.eu/place/*
// @match         *://*.musicbrainz.eu/series/*
// @match         *://*.musicbrainz.eu/url/*
// @match         *://*.musicbrainz.eu/dialog*
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

	/**
	 * Extracts the entity type and ID from a MusicBrainz URL (can be incomplete and/or with additional path components and query parameters).
	 * @param {string} url URL of a MusicBrainz entity page.
	 * @returns {{ type: CoreEntityTypeT | 'mbid', mbid: MB.MBID } | undefined} Type and ID.
	 */
	function extractEntityFromURL(url) {
		const entity = url.match(/(area|artist|event|genre|instrument|label|mbid|place|recording|release|release-group|series|url|work)\/([0-9a-f-]{36})(?:$|\/|\?)/);
		return entity ? {
			type: entity[1],
			mbid: entity[2]
		} : undefined;
	}

	/**
	 * Returns a promise that resolves after the given delay.
	 * @param {number} ms Delay in milliseconds.
	 */
	function delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Adapted from https://thoughtspile.github.io/2018/07/07/rate-limit-promises/


	function rateLimitedQueue(operation, interval) {
		let queue = Promise.resolve(); // empty queue is ready
		return (...args) => {
			const result = queue.then(() => operation(...args)); // queue the next operation
			// start the next delay, regardless of the last operation's success
			queue = queue.then(() => delay(interval), () => delay(interval));
			return result;
		};
	}

	/**
	 * Limits the number of requests for the given operation within a time interval.
	 * @template Params
	 * @template Result
	 * @param {(...args: Params) => Result} operation Operation that should be rate-limited.
	 * @param {number} interval Time interval (in ms).
	 * @param {number} requestsPerInterval Maximum number of requests within the interval.
	 * @returns {(...args: Params) => Promise<Awaited<Result>>} Rate-limited version of the given operation.
	 */
	function rateLimit(operation, interval, requestsPerInterval = 1) {
		if (requestsPerInterval == 1) {
			return rateLimitedQueue(operation, interval);
		}
		const queues = Array(requestsPerInterval).fill().map(() => rateLimitedQueue(operation, interval));
		let queueIndex = 0;
		return (...args) => {
			queueIndex = (queueIndex + 1) % requestsPerInterval; // use the next queue
			return queues[queueIndex](...args); // return the result of the operation
		};
	}

	/**
	 * Calls to the MusicBrainz API are limited to one request per second.
	 * https://musicbrainz.org/doc/MusicBrainz_API
	 */
	const callAPI = rateLimit(fetch, 1000);

	/**
	 * Makes a request to the MusicBrainz API of the currently used server and returns the results as JSON.
	 * @param {string} endpoint Endpoint (e.g. the entity type) which should be queried.
	 * @param {Record<string,string>} query Query parameters.
	 * @param {string[]} inc Include parameters which should be added to the query parameters.
	 */
	async function fetchFromAPI(endpoint, query = {}, inc = []) {
		if (inc.length) {
			query.inc = inc.join(' '); // spaces will be encoded as `+`
		}
		query.fmt = 'json';
		const headers = {
			'Accept': 'application/json',
			// 'User-Agent': 'Application name/<version> ( contact-url )',
		};
		const response = await callAPI(`https://musicbrainz.org/ws/2/${endpoint}?${new URLSearchParams(query)}`, { headers });
		if (response.ok) {
			return response.json();
		} else {
			throw response;
		}
	}

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

	function fixLinkOnNonURLPage(span){
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
	    button.addEventListener("click", (function(){fixLinkOnNonURLPage(currentSpan);}));
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
	            });
	        });
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
	    const button = document.createElement("button");
	    button.type = "button";
	    button.textContent = "Canonicalize URL";
	    button.className = "styled-button canonicalizer-button";
	    button.addEventListener("click", function(){fixLinkURLEdit(urlInput.parentElement);});
	    urlInput.insertAdjacentElement("afterend", button);
	}

	const location = document.location.href;
	if(location.match("^https?://((beta|test)\\.)?musicbrainz\\.(org|eu)/dialog")){
	    if((new URLSearchParams(document.location.search))
	       .get("path").match("^/(artist|event|label|place|series)/create")){
	        runUserscript();
	    }
	}else if(location.match("^https?://((beta|test)\\.)?musicbrainz\\.(org|eu)/url")){
	    runOnURLEditPage();
	}else {
	    runUserscript();
	}

})();
