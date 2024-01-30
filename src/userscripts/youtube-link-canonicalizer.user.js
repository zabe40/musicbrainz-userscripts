import { setReactInputValue} from '@kellnerd/es-utils/dom/react.js';
import { addMessageToEditNote} from '@kellnerd/musicbrainz-scripts/src/editNote.js';
import { fetchURL} from '../fetch.js';

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
		message = "The request was aborted."
		break;
	    case 'error':
		message = "There was an error with the request. See the console for more details."
		break;
	    case 'timeout':
		message = "The request timed out."
		break;
	    case 'httpError':
		message = `HTTP error! Status: ${error.response.status}`;
		break;
	    default:
		message = "There was an error. See the console for more details."
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
    button.addEventListener("click", (function(){fixLink(currentSpan)}));
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
	})
    })
    observer.observe(target, { childList: true, subtree:true});
}

if(document.location.href
   .match("^https?://((beta|test)\\.)?musicbrainz\\.org/dialog")){
    if((new URLSearchParams(document.location.search))
       .get("path").match("^/artist/create")){
	runUserscript();
    }
}else{
    runUserscript();
    console.log("runned");
}
