/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Bandcamp Tag Importer',
    namespace: 'https://github.com/zabe40',
    version: '2024-01-25_1',
    description: 'Easily submit tags on Bandcamp pages to Musicbrainz',
    author: 'zabe',
    homepage: 'https://github.com/zabe40/musicbrainz-userscripts',
    supportURL: 'https://github.com/zabe40/musicbrainz-userscripts/issues',
    match: '*://*.musicbrainz.org/release/*',
    connect: 'bandcamp.com',
    grant: 'GM_xmlhttpRequest'
};

export default metadata;
