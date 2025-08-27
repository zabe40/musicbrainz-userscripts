import { fetchURL} from '../fetch.js';

function fetchSpotifyTags(url, entity){
    const apiURL = "https://sambl.lioncat6.com/api/getArtistInfo/?url=";
    console.debug(apiURL + url)
    return fetchURL(apiURL + url, {responseType: "json",
                                   headers: {"User-Agent": "Taggregator Userscript/"
	                                     + GM_info.script.version + " +"
	                                     + GM_info.script.homepageURL}})
        .then((data) => data.response.providerData.genres);
}

export const spotify = { domain: "spotify.com",
                         fetchTags: fetchSpotifyTags,
                         supportedTypes: ["artist"],
                         name: "Spotify",
                         faviconClass: "spotify-favicon"};
