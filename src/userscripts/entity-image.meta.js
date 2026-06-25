import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Entity Images',
    namespace: 'https://github.com/zabe40',
    version: '2026.6.25',
    description: 'Display images on Musicbrainz for artists, labels, places, and series.',
    author: 'zabe',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],'/',['artist', 'label', 'place','series'],'/*'])
        .map((array)=>{return array.join("");}),
    connect: ["sambl.lioncat6.com", "api.wikimedia.org"],
    grant: 'GM_xmlhttpRequest'
};

// TODO
// slideshow for entities with multiple images
// fetch profile pics from twitter, wikidata
export default metadata;
