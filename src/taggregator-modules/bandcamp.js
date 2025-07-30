import { fetchAsHTML} from '../fetch.js';

function fetchBandcampTags(url, entityType){
    return fetchAsHTML(url)
        .then((html) => {
            let results = [];
            const hasLocation = html.querySelector(".location").textContent != "";
            html.querySelectorAll("a.tag")
                .forEach((currentAnchor, currentIndex, listObj) => {
                    // on Bandcamp the last tag on an album is a tag
                    // of the location in the artist's profile (if the
                    // artist has included this in their profile).
                    // this information is often innaccurate (in the
                    // case of labels with Bandcamp pages) or
                    // outdated, and regardless the information is
                    // better represented via a relationship of some
                    // sort
                    if(!hasLocation || (currentIndex != listObj.length - 1)){
                        results.push(currentAnchor.innerText);
                    }
                });
            return results;
        });
}

export const bandcamp = { domain: "bandcamp.com",
                          fetchTags: fetchBandcampTags,
                          supportedTypes: ["release"]};
