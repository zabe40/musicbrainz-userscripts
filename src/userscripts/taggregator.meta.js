import { cartesian} from '@agarimo/cartesian';
import { directoryImport } from 'directory-import';

const importedModules = directoryImport("../taggregator-modules");

/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
const metadata = {
    name: 'MusicBrainz Taggregator',
    namespace: 'https://github.com/zabe40',
    version: '2026.2.12',
    description: 'Easily submit tags from anywhere to Musicbrainz',
    author: 'zabe',
    homepage: 'https://github.com/zabe40/musicbrainz-userscripts',
    supportURL: 'https://github.com/zabe40/musicbrainz-userscripts/issues',
    match: cartesian(['*://*.musicbrainz.',['org','eu'],['', '/release', '/release-group','/artist','/work','/recording'], '/*'])
        .map((array)=>{return array.join("");}),
    grant: ['GM_xmlhttpRequest','GM_getValue','GM_setValue'],
    connect: Object.values(importedModules).map((module) => {
        let domain;
        Object.values(module).forEach((site) => domain = site.domain);
        return domain;
    }),
};

// TODO
// add screenshots/gifs to README
// maybe maintain our own mapping of aliases to genres
// add button to clear cache
// prevent from running on unsupported pages
// setting to only submit accepted genres: aerozol approved
// tag mapping customizable by user (split map value on comma)
// tag blacklist

export default metadata;
