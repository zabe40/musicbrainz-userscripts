import { setReactInputValue} from '@kellnerd/es-utils/dom/react.js';
import { addMessageToEditNote} from '@kellnerd/musicbrainz-scripts/src/editNote.js';

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
    GM_xmlhttpRequest({
	url: tableRow.querySelector("td > a").href,
	onload: function(response){
	    if(!((200 <= response.status) && (response.status <= 299))){
		throw new Error(`HTTP error! Status: ${response.status}`);
	    }
	    const html = response.responseText;
	    const parser = new DOMParser();
	    let doc = parser.parseFromString(html, "text/html");
	    tableRow.setAttribute("oldLink", tableRow.querySelector("td > a").href);
	    tableRow.setAttribute("newLink", doc.querySelector("link[rel=\"canonical\"]").href);
	    tableRow.querySelector("td.link-actions > button.edit-item").click();
	}});
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
const target = document.querySelector("#external-links-editor-container");
const observer = new MutationObserver(function(mutations){
    mutations.forEach(function(mutation){
	if(mutation.addedNodes.length > 0
	   && (mutation.addedNodes.item(0).id == "external-links-editor"
	       || (mutation.addedNodes.item(0).classList.contains("url")
		   && mutation.addedNodes.item(0).href.match("^https?://(www\\.)?youtube\\.com")))){
	    document.querySelectorAll(".youtube-favicon")
		.forEach(addFixerUpperButton);
	}
	if(mutation.removedNodes.length > 0
	   && mutation.removedNodes.item(0).nodeName !== "#text"
	   && mutation.removedNodes.item(0).classList.contains("url")){
	    mutation.target.nextElementSibling.remove();
	    mutation.target.parentElement.removeAttribute("oldLink");
	    mutation.target.parentElement.removeAttribute("newLink")
	}
    })
})
observer.observe(target, { childList: true, subtree:true});

