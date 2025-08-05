import { fetchAsHTML} from '../fetch.js';

function fetchAllmusicTags(url, entity){
    return fetchAsHTML(url)
        .then((html) => {
            let tags = [];
            const pushTag = (aElement) => {
                tags.push(aElement.textContent);
            }
            html.querySelectorAll(".genre a").forEach(pushTag);
            html.querySelectorAll(".styles a").forEach(pushTag);
            return tags;
        });
}

export const allmusic = { domain: "allmusic.com",
                          fetchTags: fetchAllmusicTags,
                          supportedTypes: ["artist", "release-group"]}
