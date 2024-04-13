import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Taggregator',
    namespace: 'https://github.com/zabe40',
    version: '2024-04-12',
    description: 'Easily submit tags from anywhere to Musicbrainz',
    author: 'zabe',
    homepage: 'https://github.com/zabe40/musicbrainz-userscripts',
    supportURL: 'https://github.com/zabe40/musicbrainz-userscripts/issues',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],'/release/*'])
        .map((array)=>{return array.join("");}),
    grant: 'GM_xmlhttpRequest'
};

// TODO
// add screenshots to readme
// handle tags with commas
// populate @connect metadata field
// normalize tags to genres
// run on pages for other types of entities?
// MOAR IMPORTERS!
export default metadata;
