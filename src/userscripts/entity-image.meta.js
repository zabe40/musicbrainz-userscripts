import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Entity Images',
    namespace: 'https://github.com/zabe40',
    version: '2024-03-29_1',
    description: 'Display images on Musicbrainz pages for artists',
    author: 'zabe',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],'/artist/*'])
        .map((array)=>{return array.join("");}),
    grant: 'GM_xmlhttpRequest'
};

// TODO
// slideshow for entities with multiple images
// show logos for labels, places, event posters
export default metadata;
