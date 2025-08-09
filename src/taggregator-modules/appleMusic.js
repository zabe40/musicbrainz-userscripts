import { fetchAsHTML} from '../fetch.js';

function fetchAppleMusicTags(url, entity){
    let id;
    switch (entity){
    case "release":
        id = "schema\\:music-album";
        break;
    case "artist":
        id = "schema\\:music-group";
        break;
    case "recording":
        id = "schema\\:song";
        break;
    }
    return fetchAsHTML(url)
        .then((html) => {
            let json = JSON.parse(html.querySelector(`script#${id}`).innerText);
            let genres = (entity == "recording") ? json.audio.genre : json.genre;
            return genres.filter((genre) => genre != "Music");
        });
}

export const appleMusic = { domain: "music.apple.com",
                            fetchTags: fetchAppleMusicTags,
                            supportedTypes: ["release", "artist","recording"],
                            name: "Apple Music",
                            faviconClass: "applemusic-favicon",}
