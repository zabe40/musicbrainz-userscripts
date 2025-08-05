# MusicBrainz Userscripts

This is a collection of userscripts that I've written for [musicbrainz.org](musicbrainz.org). To use them, first install a [userscript manager](https://wiki.musicbrainz.org/Guides/Userscripts#Userscript_manager). Then you can click on the install button to install the userscript of your choice.

## Userscripts

### MusicBrainz Bandcamp Tag Importer

Easily submit tags on Bandcamp pages to Musicbrainz

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/bandcamp-tag-importer.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/bandcamp-tag-importer.user.js)

### MusicBrainz Youtube Link Canonicalizer

Correct youtube @username artist links to channel IDs

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/youtube-link-canonicalizer.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/youtube-link-canonicalizer.user.js)

#### Why Canonicalize YouTube Links?

YouTube links should point to Channel IDs rather than a handle URL.
This helps prevent [link rot](https://en.wikipedia.org/wiki/Link_rot),
since handle URLs can change at any time, while Channel IDs are
immutable and will not change. For more information about the
different kinds of YouTube channel URLs, see [this
page](https://support.google.com/youtube/answer/6180214).

### MusicBrainz Entity Images

Display images on Musicbrainz for artists, labels, places, and series.

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/entity-image.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/entity-image.user.js)

### MusicBrainz Taggregator

Easily submit tags from anywhere to Musicbrainz

[![Install](https://img.shields.io/badge/Install-success.svg?style=for-the-badge&logo=tampermonkey)](dist/taggregator.user.js?raw=1)
[![Source](https://img.shields.io/badge/Source-grey.svg?style=for-the-badge&logo=github)](dist/taggregator.user.js)

#### Taggregator Supported Sites
* [Bandcamp](https://bandcamp.com)
* [Discogs](https://www.discogs.com)
* [Wikidata](https://www.wikidata.org)
* [Apple Music](https://music.apple.com)
* [Deezer](https://www.deezer.com)
* [Soundcloud](https://soundcloud.com)
* [Spotify](https://spotify.com)

Have a site you think I should add? [Open an issue!](https://github.com/zabe40/musicbrainz-userscripts/issues)

## Attribution
Icons used:
* "[negative](https://thenounproject.com/icon/negative-2152786/)" by [Hassan Ali](https://thenounproject.com/ihassanaliawan/), used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) / Enlarged from original
* "[Delete](https://thenounproject.com/icon/delete-680419/)" by [mikicon](https://thenounproject.com/mikicon/), used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) / Enlarged from original
* "[tick](https://thenounproject.com/icon/tick-680417/)" by [mikicon](https://thenounproject.com/mikicon/), used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) / Enlarged from original
* "[padlock](https://thenounproject.com/icon/padlock-7902390/)" by [IconsHome](https://thenounproject.com/creator/iconsHome/) used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)

## Development

These userscripts are built with kellnerd's [userscript
bundler](https://github.com/kellnerd/userscript-bundler). To build
them yourself you'll want to run `npm install` to install all the
necessary packages and then `npm run build` to build the userscripts.
