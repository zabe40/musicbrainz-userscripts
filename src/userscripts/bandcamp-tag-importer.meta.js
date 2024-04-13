import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Bandcamp Tag Importer',
    namespace: 'https://github.com/zabe40',
    version: '2024-04-12',
    description: 'Easily submit tags on Bandcamp pages to Musicbrainz',
    author: 'zabe',
    homepage: 'https://github.com/zabe40/musicbrainz-userscripts',
    supportURL: 'https://github.com/zabe40/musicbrainz-userscripts/issues',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],'/release/*'])
        .map((array)=>{return array.join("");}),
    connect: 'bandcamp.com',
    grant: 'GM_xmlhttpRequest'
};

export default metadata;
