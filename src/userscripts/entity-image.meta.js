import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Entity Images',
    namespace: 'https://github.com/zabe40',
    version: '2024-03-30',
    description: 'Display images on Musicbrainz for artists, labels, and places',
    author: 'zabe',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],'/',['artist', 'label', 'place'],'/*'])
        .map((array)=>{return array.join("");}),
    grant: 'GM_xmlhttpRequest'
};

// TODO
// slideshow for entities with multiple images
export default metadata;
