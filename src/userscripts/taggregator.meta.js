import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Taggregator',
    namespace: 'https://github.com/zabe40',
    version: '2025.7.29',
    description: 'Easily submit tags from anywhere to Musicbrainz',
    author: 'zabe',
    homepage: 'https://github.com/zabe40/musicbrainz-userscripts',
    supportURL: 'https://github.com/zabe40/musicbrainz-userscripts/issues',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],'/',['release', 'release-group','artist','work'],'/*'])
        .map((array)=>{return array.join("");}),
    grant: ['GM_xmlhttpRequest','GM_getValue','GM_setValue'],
};

// TODO
// add screenshots/gifs to README

// normalize tags to genres, lookup alias in musicbrainz
// maybe maintain our own mapping of aliases to genres
// cache looked-up genres in GM_values

// run on pages for other types of entities?
// MOAR IMPORTERS!
export default metadata;
