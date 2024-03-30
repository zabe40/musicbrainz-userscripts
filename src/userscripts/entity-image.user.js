import { extractEntityFromURL} from '@kellnerd/musicbrainz-scripts/src/entity.js';
import { fetchFromAPI} from '@kellnerd/musicbrainz-scripts/src/publicAPI.js';
import { fetchURL} from '../fetch.js';

function getImageURLs(entityURL){
    const entity = extractEntityFromURL(entityURL);
    return fetchFromAPI(entity.type + "/" + entity.mbid,
                        {"inc": "url-rels"})
        .then((response) => {
            return response.relations
                .filter((relation) => {
                    return relation.type == "image";
                })
                .map((relation) => {
                    return relation.url.resource;
                });
        })
        .then((urlArray) => {
            return Promise.all(urlArray.map(async (url) => {
                let urlObject = new Object();
                urlObject.title = url;
                if(url.match("^https?://commons\\.wikimedia\\.org/wiki/File:")){
                    urlObject.url = await wikimediaImageURL(url);
                }else{
                    urlObject.url = await url;
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

function runUserscript(){
    getImageURLs(document.location.href)
        .then((imageUrls) => {
            console.log(imageUrls);
            if(imageUrls.length > 0){
                const div = document.createElement("div");
                div.className = "entity-image";
                
                const img = document.createElement("img");
                img.src = imageUrls[0].url;
                img.style.width = "200px";
                img.style.height = "200px";
                img.style.objectFit = "cover";
                div.appendChild(img);

                if(imageUrls.length > 1){
                    const select = document.createElement("select");
                    select.id = "entity-image-selector";
                    select.style.maxWidth = "200px";
                    
                    const listener = function(event){
                        console.log(event);
                        img.src = select.selectedOptions[0].value;
                    }
                    select.addEventListener("change", listener);
                    for(const url of imageUrls){
                        const option = document.createElement("option");
                        option.textContent = url.title;
                        option.value = url.url;
                        select.appendChild(option);
                    }
                    div.appendChild(select);
                }
                
                document.querySelector("#sidebar").insertAdjacentElement("afterbegin", div);
            }
        })
}

runUserscript();
