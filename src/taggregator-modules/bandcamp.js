import { fetchAsHTML} from '../fetch.js';

function fetchBandcampTags(url){
    return fetchAsHTML(url)
        .then((html) => {
            let results = [];
            html.querySelectorAll("a.tag")
                .forEach((currentAnchor, currentIndex, listObj) => {
                    if(currentIndex != listObj.length - 1){
                        results.push(currentAnchor.innerText);
                    }
                });
            return results;
        });
}

export const bandcamp = { domain: "bandcamp.com",
                          fetchTags: fetchBandcampTags,};
