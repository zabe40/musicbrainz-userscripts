import { fetchAsHTML} from '../fetch.js';

function fetchBandcampTags(url, entityType){
    if (entityType == "artist") {
        const match = url.match(/:\/\/([^.]*).bandcamp.com/)
        if (!match || match?.length != 2) return (() => [])
        const bcSearchURL = `https://bandcamp.com/search?q=${match[1]}&item_type=b`
        return fetchAsHTML(bcSearchURL)
          .then((html) => {
              let results = [];
              html.querySelectorAll("div.itemurl")
                  .forEach((currentUrl, currentIndex, listObj) => {
                      // Bandcamp provides artist tags to artist search results
                      if (currentUrl.innerHTML.includes(`${match[1]}.bandcamp.com`)){
                        let sibling = currentUrl.nextElementSibling;
                        while (sibling) {
                          if (sibling.className == "genre"){
                            results.push(sibling.innerText.replace("genre:", "").trim())
                          }
                          if (sibling.className == "tags data-search"){
                            const tags = sibling.innerText.replace("tags:", "").split(",")
                            tags.forEach((tag) => {
                              results.push(tag.trim());
                            })
                          }
                          sibling = sibling.nextElementSibling;
                        }
                      }
                  });
              return results;
          });
    }
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
                          supportedTypes: ["release","recording","artist"],
                          name: "Bandcamp",
                          faviconClass: "bandcamp-favicon",};
