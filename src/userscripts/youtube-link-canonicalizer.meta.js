import { cartesian} from '@agarimo/cartesian';
/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Youtube Link Canonicalizer',
    namespace: 'https://github.com/zabe40',
    version: '2024-04-15',
    description: 'Correct youtube @username artist links to channel IDs',
    author: 'zabe',
    match: cartesian(["*://*.musicbrainz.",["org","eu"],"/",
                      ["artist/","event/","label/","place/","series/","url/","dialog"],"*"])
        .map((array)=>{return array.join("");}),
    connect: ['youtube.com',
              'musicbrainz.org'],
    grant: 'GM_xmlhttpRequest'
};

export default metadata;
