import { fetchAsHTML} from '../fetch.js';

function fetchBeatportTags(url, entity){
    if(entity == "label"){
        url += "/tracks?page=1&per_page=150";
    }
    return fetchAsHTML(url)
        .then((html) => {
            let results = new Set();
            let json = JSON.parse(html.querySelector("script#__NEXT_DATA__").innerText);
            switch (entity){
            case "release":
            case "label":
                for(const query of json.props.pageProps.dehydratedState.queries){
                    if(query.queryKey[0] == "tracks"){
                        for(const track of query.state.data.results){
                            results.add(track.genre.name);
                        }
                    }
                }
                break;
            case "recording":
                for(const query of json.props.pageProps.dehydratedState.queries){
                    if(query.queryKey[0].match("^track-\\d+$")){
                        results.add(query.state.data.genre.name);
                    }
                }
                break;
            }
            return Array.from(results);
        })
}

export const beatport = { domain: "beatport.com",
                          fetchTags: fetchBeatportTags,
                          supportedTypes: ["release", "recording","label"],
                          name: "Beatport",
                          faviconClass: "beatport-favicon"}
