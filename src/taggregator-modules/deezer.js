import { fetchURL} from '../fetch.js';

function fetchDeezerTags(url, entityType){
    const apiUrl = "https://api.deezer.com/album/";
    let urlObj = new URL(url);
    let id = urlObj.pathname.split('/')[2];
    return fetchURL(apiUrl + id, {responseType: 'json'})
        .then((response) => {
            return response.response.genres.data.map((genre) => genre.name);
        });
}

export const deezer = { domain: "deezer.com",
                        fetchTags: fetchDeezerTags,
                        supportedTypes: ["release"]}
