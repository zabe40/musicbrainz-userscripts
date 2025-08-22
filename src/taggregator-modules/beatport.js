import { fetchAsHTML} from '../fetch.js';

function fetchBeatportTags(url, entity){
    if(entity == "label" || entity == "artist"){
        url += "/tracks?page=1&per_page=150";
    }
    return fetchAsHTML(url)
        .then((html) => {
            let results = new Set();
            let json = JSON.parse(html.querySelector("script#__NEXT_DATA__").innerText);
            switch (entity){
            case "release":
            case "artist":
            case "label":
                for(const query of json.props.pageProps.dehydratedState.queries){
                    if(query.queryKey[0] == "tracks"){
                        for(const track of query.state.data.results){
                            for(const tag of translateBeatportTag(track.genre.name)){
                                results.add(tag)
                            }
                        }
                    }
                }
                break;
            case "recording":
                for(const query of json.props.pageProps.dehydratedState.queries){
                    if(query.queryKey[0].match("^track-\\d+$")){
                        for(const tag of translateBeatportTag(query.state.data.genre.name)){
                            results.add(tag)
                        }
                    }
                }
                break;
            }
            return Array.from(results);
        })
}

function translateBeatportTag(tag){
    if(beatportGenreMap[tag]){
        return beatportGenreMap[tag].split("\w*,\w*");
    }else{
        console.log(`genre not found: "${tag}"`);
        return new Array(tag);
    }
}

export const beatport = { domain: "beatport.com",
                          fetchTags: fetchBeatportTags,
                          supportedTypes: ["release", "recording","artist", "label"],
                          name: "Beatport",
                          faviconClass: "beatport-favicon"}

// list taken from https://labelsupport.beatport.com/hc/en-us/articles/9709209306772-Beatport-Genres-and-Sub-Genres
const beatportGenreMap = {
    "140 / Deep Dubstep / Grime": "deep dubstep, grime",
    "140 / Deep Dubstep / Grime | Grime": "grime",
    "Afro House": "afro house",
    "Afro House | Afro / Latin": "latin house",
    "Afro House | Afro Melodic": "afro house, melodic house",
    "Afro House | 3Step": "3-step",
    "Amapiano": "amapiano",
    "Amapiano | Gqom": "gqom",
    "Ambient / Experimental": "ambient, experimental",
    "Bass House": "bass house",
    "Bass / Club": "bass, club",
    "Breaks / Breakbeat / UK Bass": "breaks,breakbeat",
    "Breaks / Breakbeat / UK Bass | Glitch Hop": "glitch hop",
    "Brazilian Funk": "funk brasileiro",
    "Brazilian Funk | Carioca Funk": "funk carioca",
    "Brazilian Funk | Mandelao Funk": "funk mandelão",
    "Brazilian Funk | BH Funk": "funk de bh",
    "Brazilian Funk | Melodic Funk": "funk melody",
    "Dance / Pop": "dance, pop",
    "Dance / Pop | Afro Pop": "afro pop",
    "Dance / Pop | Pop": "pop",
    "Dance / Pop | Tropical House": "tropical house",
    "Deep House": "deep house",
    "DJ Tools": "dj tools",
    "DJ Tools | Loops": "loops",
    "DJ Tools | Acapellas": "acapella",
    "DJ Tools | Battle Tools": "dj battle tools",
    "Downtempo": "downtempo",
    "Drum & Bass": "drum and bass",
    "Drum & Bass | Liquid": "liquid drum and bass",
    "Drum & Bass | Jump Up": "jump up",
    "Drum & Bass | Jungle": "jungle",
    "Drum & Bass | Deep": "deep drum and bass",
    "Drum & Bass | Halftime": "halftime",
    "Dubstep": "dubstep",
    "Dubstep | Melodic Dubstep": "melodic dubstep",
    "Dubstep | Midtempo": "midtempo bass",
    "Electro (Classic / Detroit / Modern)": "electro",
    "Electronica": "electronica",
    "Funky House": "funky house",
    "Hard Dance / Hardcore / Neo Rave": "hardcore",
    "Hard Dance / Hardcore / Neo Rave | Hardstyle": "hardstyle",
    "Hard Dance / Hardcore / Neo Rave | Hard House": "hard house",
    "Hard Dance / Hardcore / Neo Rave | Uptempo": "uptempo hardcore",
    "Hard Dance / Hardcore / Neo Rave | Terror": "terrorcore",
    "Hard Dance / Hardcore / Neo Rave | UK / Happy Hardcore": "uk hardcore, happy hardcore",
    "Hard Dance / Hardcore / Neo Rave | Frenchcore": "frenchcore",
    "Hard Dance / Hardcore / Neo Rave | Neo Rave": "hardcore, new rave, neo rave",
    "Hard Techno": "hard techno",
    "House": "house",
    "House | Acid": "acid house",
    "House | Soulful": "soul, house",
    "Indie Dance": "indie dance",
    "Indie Dance | Dark Disco": "dark disco",
    "Jackin House": "jackin house",
    "Mainstage": "edm",
    "Mainstage | Big Room": "big room house",
    "Mainstage | Electro House": "electro house",
    "Mainstage | Future House": "future house",
    "Mainstage | Speed House": "speed house",
    "Mainstage | Future Rave": "future rave",
    "Melodic House & Techno": "edm, melodic house, melodic techno",
    "Melodic House & Techno | Melodic House": "melodic house",
    "Melodic House & Techno | Melodic Techno": "melodic techno",
    "Minimal / Deep Tech": "deep tech",
    "Minimal / Deep Tech | Bounce": "bounce",
    "Minimal / Deep Tech | Deep Tech": "deep tech",
    "Nu Disco / Disco": "disco",
    "Nu Disco / Disco | Funk / Soul": "disco, funk",
    "Nu Disco / Disco | Italo": "italo-disco",
    "Organic House": "organic house",
    "Progressive House": "progressive house",
    "Psy-Trance": "psytrance",
    "Psy-Trance | Full-On": "full-on",
    "Psy-Trance | Progressive Psy": "progressive psytrance",
    "Psy-Trance | Psychedelic": "psychedelic",
    "Psy-Trance | Dark & Forest": "dark psytrance, forest psytrance",
    "Psy-Trance | Goa Trance": "goa trance",
    "Psy-Trance | Psycore & Hi-Tech": "psycore, hi-tech",
    "Tech House": "tech house",
    "Tech House | Latin Tech": "latin, tech house",
    "Techno (Peak Time / Driving)": "techno",
    "Techno (Peak Time / Driving) | Driving": "driving techno, techno",
    "Techno (Peak Time / Driving) | Peak Time": "peak time techno",
    "Techno (Raw / Deep / Hypnotic)": "techno",
    "Techno (Raw / Deep / Hypnotic) | Broken": "broken techno, techno",
    "Techno (Raw / Deep / Hypnotic) | Deep / Hypnotic": "deep techno",
    "Techno (Raw / Deep / Hypnotic) | Dub": "dub",
    "Techno (Raw / Deep / Hypnotic) | EBM": "ebm",
    "Techno (Raw / Deep / Hypnotic) | Raw": "techno, raw techno",
    "Trance (Main Floor)": "trance",
    "Trance (Main Floor) | Progressive Trance": "progressive trance",
    "Trance (Main Floor) | Tech Trance": "tech trance",
    "Trance (Main Floor) | Uplifting Trance": "trance, uplifting",
    "Trance (Main Floor) | Vocal Trance": "vocal trance",
    "Trance (Main Floor) | Hard Trance": "hard trance",
    "Trance (Raw / Deep / Hypnotic)": "trance",
    "Trance (Raw / Deep / Hypnotic) | Raw Trance": "trance, raw trance",
    "Trance (Raw / Deep / Hypnotic) | Deep Trance": "trance, deep trance",
    "Trance (Raw / Deep / Hypnotic) | Hypnotic Trance": "trance, hypnotic trance",
    "Trap / Future Bass": "trap, future bass",
    "Trap / Future Bass | Trap": "trap",
    "Trap / Future Bass | Baile Funk": "trap, future bass, baile funk",
    "UK Garage / Bassline": "bassline, uk garage",
    "UK Garage / Bassline | UK Garage": "uk garage",
    "UK Garage / Bassline | Bassline: ": "bassline",
};
