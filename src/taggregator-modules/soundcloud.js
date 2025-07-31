import { fetchAsHTML} from '../fetch.js';

function fetchSoundcloudTags(url, entityType){
    return fetchAsHTML(url)
        .then((html) => {
            let tags = [];
            html.querySelectorAll("script").forEach((script) => {
                if(script.textContent.substring(0,50).includes("window.__sc_hydration = ")){
                    let hydration = JSON.parse(script.textContent.substring("window.__sc_hydration = ".length, script.textContent.length - 1));
                    for(const hydratable of hydration){
                        if(hydratable.hydratable == "sound" ||
                           hydratable.hydratable == "playlist"){
                            let sound = hydratable.data;
                            if(sound.genre){
                                tags = tags.concat(sound.genre);
                            }
                            if(sound.tag_list){
                                tags = tags.concat(parseSoundcloudTagList(sound.tag_list));
                            }
                        }
                    }
                }
            })
            return tags;
        })
}

function parseSoundcloudTagList(string){
    let tags = [];
    let quotedTag = "";
    let inQuote = false;
    string.split(" ").forEach((tagFragment) => {
        if(tagFragment.startsWith("\"")){
            quotedTag = tagFragment.substring(1);
            inQuote = true;
        }else if(tagFragment.endsWith("\"")){
            quotedTag += " " + tagFragment.substring(0, tagFragment.length - 1);
            tags.push(quotedTag);
            quotedTag = "";
            inQuote = false;
        }else if(inQuote == true){
            quotedTag += " " + tagFragment;
        }else{
            tags.push(tagFragment);
        }
    })
    return tags;
}

export const soundcloud = { domain: "soundcloud.com",
                            fetchTags: fetchSoundcloudTags,
                            supportedTypes: ["release", "recording"]}
