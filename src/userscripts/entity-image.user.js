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
                }else{
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
