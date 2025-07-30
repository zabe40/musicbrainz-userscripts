function fetchDiscogsTags(url, entityType){
    let urlObj = new URL(url);
    let path = urlObj.pathname.split('/');
    let APIURL = "https://api.discogs.com/";
    APIURL += path[1] + "s/" + path[2];
    const headers = new Headers();
    headers.append("User-Agent","Taggregator Userscript/" + GM_info.script.version + " +" + GM_info.script.homepageURL);
    headers.append("Accept", "application/vnd.discogs.v2.html+json");
    return fetch(APIURL,{headers: headers})
        .then((response) => response.json())
        .then((data) => data.genres.concat(data.styles));
}

export const discogs = { domain: "discogs.com",
                         fetchTags: fetchDiscogsTags,
                         supportedTypes: ["release-group","release"]};
