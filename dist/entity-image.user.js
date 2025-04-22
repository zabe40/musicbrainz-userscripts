// ==UserScript==
// @name          MusicBrainz Entity Images
// @version       2024.7.22
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Display images on Musicbrainz for artists, labels, and places
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-entity-images
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/entity-image.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/entity-image.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @match         *://*.musicbrainz.org/artist/*
// @match         *://*.musicbrainz.org/label/*
// @match         *://*.musicbrainz.org/place/*
// @match         *://*.musicbrainz.eu/artist/*
// @match         *://*.musicbrainz.eu/label/*
// @match         *://*.musicbrainz.eu/place/*
// ==/UserScript==

(function () {
	'use strict';

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

	function fetchURL(url, options = {}){
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

	function getImageURLs(entityURL){
	    const entity = extractEntityFromURL(entityURL);
	    return fetchFromAPI(entity.type + "/" + entity.mbid,
	                        {"inc": "url-rels"})
	        .then((response) => {
	            return response.relations
	                .filter((relation) => {
	                    return ["image", "logo", "poster"].includes(relation.type);
	                })
	                .map((relation) => {
	                    return relation.url.resource;
	                });
	        })
	        .then((urlArray) => {
	            return Promise.all(urlArray.map(async (url) => {
	                let urlObject = new Object();
	                urlObject.href = url;
	                if(url.match("^https?://commons\\.wikimedia\\.org/wiki/File:")){
	                    urlObject.src = await wikimediaImageURL(url);
	                }else {
	                    urlObject.src = await url;
	                }
	                return urlObject;
	            }));
	        });
	}

	function wikimediaImageURL(wikimediaCommonsURL){
	    const url = new URL(wikimediaCommonsURL);
	    const fetched = "https://api.wikimedia.org/core/v1/commons/file/"
	          + url.pathname.split('/').at(-1);
	    console.log(fetched);
	    return fetchURL(fetched)
	        .then((response) => {
	            const json = JSON.parse(response.responseText);
	            return json.thumbnail.url;
	        });
	}

	function createImage(urlObject){
	    const a = document.createElement("a");
	    a.href = urlObject.href;
	    a.className = "picture";

	    const img = document.createElement("img");
	    img.src = urlObject.src;
	    img.alt = urlObject.alt || "";

	    a.appendChild(img);
	    return a;
	}

	function runUserscript(){
	    getImageURLs(document.location.href)
	        .then((imageUrls) => {
	            if(imageUrls.length > 0){
	                const div = document.createElement("div");
	                div.className = "entity-image";
	                
	                for(const urlObject of imageUrls){
	                    div.appendChild(createImage(urlObject));
	                }
	                if(imageUrls.length > 1){
	                    const select = document.createElement("select");
	                    select.id = "entity-image-selector";
	                    select.style.maxWidth = "218px";
	                    
	                    let updateImages = function(event){
	                        console.log(event);
	                        const imageIndex = select.selectedIndex;
	                        if(imageIndex == -1){
	                            imageIndex = 0;
	                        }
	                        div.querySelectorAll("a").forEach((item, index, list) => {
	                            item.hidden = (index != imageIndex);
	                        });
	                    };
	                    select.addEventListener("change", updateImages);
	                    for(const url of imageUrls){
	                        const option = document.createElement("option");
	                        option.textContent = url.href;
	                        option.value = url.src;
	                        select.appendChild(option);
	                    }
	                    div.appendChild(select);
	                    updateImages();
	                }
	                document.querySelector("#sidebar").insertAdjacentElement("afterbegin", div);
	            }
	        });
	}

	runUserscript();

})();
