import { extractEntityFromURL} from '@kellnerd/musicbrainz-scripts/src/entity.js';
import { fetchFromAPI} from '@kellnerd/musicbrainz-scripts/src/publicAPI.js';
import { fetchURL} from '../fetch.js';

function uniqueBy(array, key) {
    let seen = {};
    return array.filter((item) => {
        let k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
}

function getImageURLs(entityURL){
    const entity = extractEntityFromURL(entityURL);
    return fetchFromAPI(entity.type + "/" + entity.mbid,
                        {"inc": "url-rels"})
        .then((response) => {
            return response.relations
                .filter((relation) => {
                    return relation["target-type"] == "url";
                })
                .map((relation) => {
                    return {href: relation.url.resource,
                            isImage: ["image", "logo", "poster"].includes(relation.type)};
                })
        })
        .then((urlObjArray) =>{
            return uniqueBy(urlObjArray, (urlObj) => urlObj.href);
        })
        .then((urlObjArray) => {
            return Promise.allSettled(urlObjArray.map(async (urlObject) => {
                let url = urlObject.href;
                if(url.match("^https?://commons\\.wikimedia\\.org/wiki/File:")){
                    urlObject.src = await wikimediaImageURL(url);
                    urlObject.isImage = true;
                }else if(isSAMBLable(url)){
                    urlObject.src = await samblImageURL(url);
                    urlObject.isImage = true;
                }else if(urlObject.isImage){
                    urlObject.src = await url;
                }else{
                    urlObject.isImage = false;
                }
                return urlObject;
            }));
        })
        .then((resultsArray) => {
            return resultsArray
                .map((result) => {
                    if(result.status == "fulfilled"){
                        return result.value;
                    }else{
                        return false;
                    }
                })
                .filter((urlObjOrFalse) => urlObjOrFalse)
                .filter((urlObj) => urlObj.isImage);
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

function isSAMBLable(url){
    return url.match("^https?://open\\.spotify\\.com/artist")
        || url.match("^https?://www\\.deezer\\.com/artist")
        || url.match("^https?://tidal\\.com/artist/")
        || url.match("^https?://soundcloud\\.com")
        || url.match("^https?://open\\.qobuz\\.com/artist")
        || url.match("^https?://[^.]*.bandcamp.com/");
}

function samblImageURL(url){
    const apiURL = "https://sambl.lioncat6.com/api/getArtistInfo/?url=";
    return fetchURL(apiURL + url, {responseType: "json",
                                   headers: {"User-Agent": "Entity Images Userscript/"
                                             + GM_info.script.version + " +"
                                             + GM_info.script.homepageURL}})
        .then((response) => {
            let json = response.response;
            return json.providerData.imageUrl;
        })
}

function createImage(urlObject){
    const div = document.createElement("div");
    div.className = "picture";

    const img = document.createElement("img");
    img.src = urlObject.src;
    img.alt = urlObject.alt || "";

    div.appendChild(img);
    return div;
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
                        div.querySelectorAll(".picture").forEach((item, index, list) => {
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
