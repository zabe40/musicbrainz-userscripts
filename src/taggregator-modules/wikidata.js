import { fetchURL} from '../fetch.js';

const apiUrl = "http://www.wikidata.org/wiki/Special:EntityData/";
const fetchOptions = {headers: {"User-Agent": "Taggregator Userscript/" + GM_info.script.version + " +" + GM_info.script.homepageURL,
                                    "Accept": "application/json",
                                    "Accept-Encoding": "gzip,deflate",},
                      responseType: 'json',};

function fetchWikidataTags(url, entityType){
    let urlObj = new URL(url);
    let entityID = urlObj.pathname.split('/')[2];
    return fetchURL(apiUrl + entityID, fetchOptions)
        .then((json) => {
            const claims = json.response.entities[entityID].claims;
            let promises = [];
            if(claims.P136){
                for(const genre of claims.P136){
                    let genreID = genre.mainsnak.datavalue.value.id;
                    promises.push(fetchWikidataGenreName(genreID));
                }
            }
            return Promise.allSettled(promises).then((results) => {
                let genres = [];
                for (const result of results){
                    if(result.status == "fulfilled"){
                        genres.push(result.value)
                    }
                }
                return genres;
            });
        });
}

function fetchWikidataGenreName(genreID){
    const gmNamespace = "WikidataGenreNameCache:";
    const cached = GM_getValue(gmNamespace + genreID);
    if(cached){
        return Promise.resolve(cached);
    }else{
        return fetchURL(apiUrl + genreID, fetchOptions)
            .then((json) => {
                const name = json.response.entities[genreID].labels.en.value;
                GM_setValue(gmNamespace + genreID, name);
                return name;
            });
    }
}

export const wikidata = { domain: "wikidata.org",
                          fetchTags: fetchWikidataTags,
                          supportedTypes: ["artist", "release-group","release","work"]};
