/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Taggregator',
    namespace: 'https://github.com/zabe40',
    version: '2024-03-06_1',
    description: 'Easily submit tags from anywhere to Musicbrainz',
    author: 'zabe',
    homepage: 'https://github.com/zabe40/musicbrainz-userscripts',
    supportURL: 'https://github.com/zabe40/musicbrainz-userscripts/issues',
    match: '*://*.musicbrainz.org/release/*',
    grant: 'GM_xmlhttpRequest'
};

// TODO
// edit svg icons to fill up frame
// handle tags with commas
// tell user which tags come from which source in a tooltip
// normalize tags to genres
// run on pages for other types of entities?
// MOAR IMPORTERS!
export default metadata;
