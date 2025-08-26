// https://wiki.vocadb.net/docs/development/public-api
import { fetchURL} from '../fetch.js';

function fetchVocaDBTags(url, entityType){
    let apiURL = "https://vocadb.net/api/";
    const query = new URLSearchParams();
    query.append("fields", "Tags");
    let urlObj = new URL(url);
    let id = urlObj.pathname.split('/')[2];
    apiURL += {"Al": "albums",
               "Ar": "artists",
               "E": "releaseEvents",
               "S": "songs"}[urlObj.pathname.split('/')[1]];
    apiURL += "/" + id + "?" + query;
    return fetchURL(apiURL, {responseType: "json",
                             headers: {"User-Agent": "Taggregator Userscript/"
                                       + GM_info.script.version + " +"
                                       + GM_info.script.homepageURL}})
        .then((data) => {
            let results = [];
            for(const tag of data.response.tags){
                if(["Animation","Composition","Games","Genres","Instruments",
                    "Jobs","Lyrics","Subjective","Themes","Vocalists"]
                   .includes(tag.tag.categoryName)){
                    results.push(tag.tag.name);
                }
            }
            return results;
        });
}

export const vocadb = { domain: "vocadb.net",
                        fetchTags: fetchVocaDBTags,
                        supportedTypes: [ "event","release-group","release",
                                         "artist","recording","work"],
                        name: "VocaDB",
                        faviconClass: "vocadb-favicon"};
