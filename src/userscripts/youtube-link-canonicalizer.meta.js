/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Youtube Link Canonicalizer',
    namespace: 'https://github.com/zabe40',
    version: '2024-01-31',
    description: 'Correct youtube @username artist links to channel IDs',
    author: 'zabe',
    match: ["*://*.musicbrainz.org/artist/*",
            "*://*.musicbrainz.org/dialog*"],
    connect: 'youtube.com',
    grant: 'GM_xmlhttpRequest'
};

export default metadata;
