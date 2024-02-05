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

## Development

These userscripts are build with kellnerd's [userscript
bundler](https://github.com/kellnerd/userscript-bundler). To build
them yourself you'll want to run `npm install` to install all the
necessary packages and then `npm run build` to build the userscripts.
