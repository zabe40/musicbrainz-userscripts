// ==UserScript==
// @name          MusicBrainz Taggregator
// @version       2025.8.5
// @namespace     https://github.com/zabe40
// @author        zabe
// @description   Easily submit tags from anywhere to Musicbrainz
// @homepageURL   https://github.com/zabe40/musicbrainz-userscripts#musicbrainz-taggregator
// @downloadURL   https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/taggregator.user.js
// @updateURL     https://raw.github.com/zabe40/musicbrainz-userscripts/main/dist/taggregator.user.js
// @supportURL    https://github.com/zabe40/musicbrainz-userscripts/issues
// @grant         GM_xmlhttpRequest
// @grant         GM_getValue
// @grant         GM_setValue
// @match         *://*.musicbrainz.org/*
// @match         *://*.musicbrainz.org/release/*
// @match         *://*.musicbrainz.org/release-group/*
// @match         *://*.musicbrainz.org/artist/*
// @match         *://*.musicbrainz.org/work/*
// @match         *://*.musicbrainz.org/recording/*
// @match         *://*.musicbrainz.eu/*
// @match         *://*.musicbrainz.eu/release/*
// @match         *://*.musicbrainz.eu/release-group/*
// @match         *://*.musicbrainz.eu/artist/*
// @match         *://*.musicbrainz.eu/work/*
// @match         *://*.musicbrainz.eu/recording/*
// ==/UserScript==

(function () {
  'use strict';

  var img$3 = "data:image/svg+xml,%3csvg version='1.1' x='0px' y='0px' viewBox='0 0 41.799999 41.799999' xml:space='preserve' width='41.799999' height='41.799999' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3cpolygon points='50%2c42.9 36.1%2c29.1 29.1%2c36.1 42.9%2c50 29.1%2c63.9 36.1%2c70.9 50%2c57.1 63.9%2c70.9 70.9%2c63.9 57.1%2c50 70.9%2c36.1 63.9%2c29.1 ' transform='translate(-29.1%2c-29.1)' /%3e%3c/svg%3e";
    var errorIcon = img$3;

  var img$2 = "data:image/svg+xml,%3csvg version='1.1' x='0px' y='0px' viewBox='0 0 511.97501 117.746' enable-background='new 0 0 512 512' xml:space='preserve' width='511.97501' height='117.746' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3crect x='0' y='0' width='511.97501' height='117.746' /%3e%3c/svg%3e";
    var siteUnsupportedIcon = img$2;

  var img$1 = "data:image/svg+xml,%3csvg version='1.1' x='0px' y='0px' viewBox='0 0 100 75.289574' xml:space='preserve' width='100' height='75.289574' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3cpolygon points='44%2c69.5 75.9%2c37.6 68.8%2c30.5 44%2c55.3 31.2%2c42.6 24.1%2c49.6 ' transform='matrix(1.9305019%2c0%2c0%2c1.9305019%2c-46.525096%2c-58.880308)' /%3e%3c/svg%3e";
    var successIcon = img$1;

  var img = "data:image/svg+xml,%3c%3fxml version='1.0' encoding='UTF-8' standalone='no'%3f%3e%3csvg version='1.1' viewBox='-5.0 -10.0 110.0 135.0' id='svg1' sodipodi:docname='authIcon.svg' inkscape:version='1.4.2 (ebf0e940d0%2c 2025-05-08)' xmlns:inkscape='http://www.inkscape.org/namespaces/inkscape' xmlns:sodipodi='http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd' xmlns='http://www.w3.org/2000/svg' xmlns:svg='http://www.w3.org/2000/svg'%3e %3cdefs id='defs1' /%3e %3csodipodi:namedview id='namedview1' pagecolor='%23505050' bordercolor='%23eeeeee' borderopacity='1' inkscape:showpageshadow='0' inkscape:pageopacity='0' inkscape:pagecheckerboard='0' inkscape:deskcolor='%23505050' inkscape:zoom='3.6148148' inkscape:cx='55.05123' inkscape:cy='40.665984' inkscape:window-width='1366' inkscape:window-height='690' inkscape:window-x='0' inkscape:window-y='0' inkscape:window-maximized='1' inkscape:current-layer='svg1' /%3e %3cpath d='m 91.552121%2c48.498344 h -3.28707 V 28.25021 c 0%2c-20.9718279 -16.967796%2c-38.250215 -38.250215%2c-38.250215 -21.15084%2c0 -38.250216%2c17.1468071 -38.250216%2c38.250215 l 0.006%2c20.248134 H 8.4415967 c -4.9486607%2c0 -9.00073528%2c4.052076 -9.00073528%2c9.000735 V 74.419445 C -0.55913858%2c102.36659 22.074279%2c125 50.021416%2c125 c 27.898185%2c1e-5 50.537724%2c-22.63341 50.537724%2c-50.580555 l -0.006%2c-16.920366 c 0%2c-4.948659 -4.004339%2c-9.000735 -9.000736%2c-9.000735 z M 54.521323%2c88.774291 v 12.192329 c 0%2c2.47434 -2.026037%2c4.50038 -4.500367%2c4.50038 -2.522067%2c0 -4.500368%2c-2.02605 -4.500368%2c-4.50038 V 88.774291 c -3.962415%2c-1.757062 -6.747644%2c-5.713663 -6.747644%2c-10.303689 0%2c-6.209693 5.038319%2c-11.248012 11.248012%2c-11.248012 6.209694%2c0 11.248011%2c5.038319 11.248011%2c11.248012 0%2c4.590026 -2.791042%2c8.546474 -6.747644%2c10.303689 z M 70.269702%2c48.498344 H 29.771903 V 28.25021 c 0%2c-11.206089 9.042658%2c-20.2481341 20.248135%2c-20.2481341 11.433295%2c0 20.248134%2c9.3174471 20.248134%2c20.2481341 z' id='path1' style='stroke-width:1.53001' /%3e%3c/svg%3e";
    var authIcon = img;

  // Adapted from https://stackoverflow.com/a/46012210

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

  /**
   * Sets the value of an input element which has been manipulated by React.
   * @param {HTMLInputElement} input 
   * @param {string} value 
   */
  function setReactInputValue(input, value) {
  	nativeInputValueSetter.call(input, value);
  	input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;

  /**
   * Sets the value of a textarea input element which has been manipulated by React.
   * @param {HTMLTextAreaElement} input 
   * @param {string} value 
   */
  function setReactTextareaValue(input, value) {
  	nativeTextareaValueSetter.call(input, value);
  	input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function fetchURL(url, options = {}){
      return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
              url: url,
              onload: function(response){
                  if(400 <= response.status){
                      reject(new Error(`HTTP error! Status: ${response.status}`,
                                       { cause: response}));
                  }else {
                      resolve(response);
                  }
              },
              onabort: function(error){
                  reject(new Error("The request was aborted.",
                                   { cause: error}));
              },
              onerror: function(error){
                  reject(new Error("There was an error with the request. See the console for more details.",
                                   { cause: error}));
              },
              ontimeout: function(error){
                  reject(new Error("The request timed out.",
                                   { cause: error}));
              },
              ...options,
          });
      });
  }

  function fetchAsHTML(url, options){
      return fetchURL(url, options)
          .then((response) => {
              const html = response.responseText;
              const parser = new DOMParser();
              return parser.parseFromString(html, "text/html");
          })
  }

  function fetchBandcampTags(url, entityType){
      return fetchAsHTML(url)
          .then((html) => {
              let results = [];
              const hasLocation = html.querySelector(".location").textContent != "";
              html.querySelectorAll("a.tag")
                  .forEach((currentAnchor, currentIndex, listObj) => {
                      // on Bandcamp the last tag on an album is a tag
                      // of the location in the artist's profile (if the
                      // artist has included this in their profile).
                      // this information is often innaccurate (in the
                      // case of labels with Bandcamp pages) or
                      // outdated, and regardless the information is
                      // better represented via a relationship of some
                      // sort
                      if(!hasLocation || (currentIndex != listObj.length - 1)){
                          results.push(currentAnchor.innerText);
                      }
                  });
              return results;
          });
  }

  const bandcamp = { domain: "bandcamp.com",
                            fetchTags: fetchBandcampTags,
                            supportedTypes: ["release","recording"]};

  function fetchDiscogsTags(url, entityType){
      let urlObj = new URL(url);
      let path = urlObj.pathname.split('/');
      let APIURL = "https://api.discogs.com/";
      APIURL += path[1] + "s/" + path[2];
      const headers = new Headers();
      headers.append("User-Agent","Taggregator Userscript/" + GM_info.script.version + " +" + GM_info.script.homepageURL);
      headers.append("Accept", "application/vnd.discogs.v2.html+json");
      return fetch(APIURL,{headers: headers})
          .then((response) => response.json())
          .then((data) => data.genres.concat(data.styles));
  }

  const discogs = { domain: "discogs.com",
                           fetchTags: fetchDiscogsTags,
                           supportedTypes: ["release-group","release"]};

  const apiUrl = "http://www.wikidata.org/wiki/Special:EntityData/";
  const fetchOptions = {headers: {"User-Agent": "Taggregator Userscript/" + GM_info.script.version + " +" + GM_info.script.homepageURL,
                                      "Accept": "application/json",
                                      "Accept-Encoding": "gzip,deflate",},
                        responseType: 'json',};

  function fetchWikidataTags(url, entityType){
      let urlObj = new URL(url);
      let entityID = urlObj.pathname.split('/')[2];
      return fetchURL(apiUrl + entityID, fetchOptions)
          .then((json) => {
              const claims = json.response.entities[entityID].claims;
              let promises = [];
              if(claims.P136){
                  for(const genre of claims.P136){
                      let genreID = genre.mainsnak.datavalue.value.id;
                      promises.push(fetchWikidataGenreName(genreID));
                  }
              }
              return Promise.allSettled(promises).then((results) => {
                  let genres = [];
                  for (const result of results){
                      if(result.status == "fulfilled"){
                          genres.push(result.value);
                      }
                  }
                  return genres;
              });
          });
  }

  function fetchWikidataGenreName(genreID){
      const gmNamespace = "WikidataGenreNameCache:";
      const cached = GM_getValue(gmNamespace + genreID);
      if(cached){
          return Promise.resolve(cached);
      }else {
          return fetchURL(apiUrl + genreID, fetchOptions)
              .then((json) => {
                  const name = json.response.entities[genreID].labels.en.value;
                  GM_setValue(gmNamespace + genreID, name);
                  return name;
              });
      }
  }

  const wikidata = { domain: "wikidata.org",
                            fetchTags: fetchWikidataTags,
                            supportedTypes: ["artist", "release-group","release","work"]};

  function fetchAppleMusicTags(url, entity){
      let id;
      switch (entity){
      case "release":
          id = "schema\\:music-album";
          break;
      case "artist":
          id = "schema\\:music-group";
          break;
      case "recording":
          id = "schema\\:song";
          break;
      }
      return fetchAsHTML(url)
          .then((html) => {
              let json = JSON.parse(html.querySelector(`script#${id}`).innerText);
              let genres = (entity == "recording") ? json.audio.genre : json.genre;
              return genres.filter((genre) => genre != "Music");
          });
  }

  const appleMusic = { domain: "music.apple.com",
                              fetchTags: fetchAppleMusicTags,
                              supportedTypes: ["release", "artist","recording"]};

  function fetchDeezerTags(url, entityType){
      const apiUrl = "https://api.deezer.com/album/";
      let urlObj = new URL(url);
      let id = urlObj.pathname.split('/')[2];
      return fetchURL(apiUrl + id, {responseType: 'json'})
          .then((response) => {
              return response.response.genres.data.map((genre) => genre.name);
          });
  }

  const deezer = { domain: "deezer.com",
                          fetchTags: fetchDeezerTags,
                          supportedTypes: ["release"]};

  function fetchSoundcloudTags(url, entityType){
      return fetchAsHTML(url)
          .then((html) => {
              let tags = [];
              html.querySelectorAll("script").forEach((script) => {
                  if(script.textContent.substring(0,50).includes("window.__sc_hydration = ")){
                      let hydration = JSON.parse(script.textContent.substring("window.__sc_hydration = ".length, script.textContent.length - 1));
                      for(const hydratable of hydration){
                          if(hydratable.hydratable == "sound" ||
                             hydratable.hydratable == "playlist"){
                              let sound = hydratable.data;
                              if(sound.genre){
                                  tags = tags.concat(sound.genre);
                              }
                              if(sound.tag_list){
                                  tags = tags.concat(parseSoundcloudTagList(sound.tag_list));
                              }
                          }
                      }
                  }
              });
              return tags;
          })
  }

  function parseSoundcloudTagList(string){
      let tags = [];
      let quotedTag = "";
      let inQuote = false;
      string.split(" ").forEach((tagFragment) => {
          if(tagFragment.startsWith("\"")){
              quotedTag = tagFragment.substring(1);
              inQuote = true;
          }else if(tagFragment.endsWith("\"")){
              quotedTag += " " + tagFragment.substring(0, tagFragment.length - 1);
              tags.push(quotedTag);
              quotedTag = "";
              inQuote = false;
          }else if(inQuote == true){
              quotedTag += " " + tagFragment;
          }else {
              tags.push(tagFragment);
          }
      });
      return tags;
  }

  const soundcloud = { domain: "soundcloud.com",
                              fetchTags: fetchSoundcloudTags,
                              supportedTypes: ["release", "recording"]};

  const clientId = '2cd89e83465c42ecbc9fec4e01f84958';

  async function spotifyAuthenticate(){
      console.log("authenticating spotify");
      const generateRandomString = (length) => {
          const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          const values = crypto.getRandomValues(new Uint8Array(length));
          return values.reduce((acc, x) => acc + possible[x % possible.length], "");
      };

      const codeVerifier = generateRandomString(64);

      const sha256 = async (plain) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(plain);
          return window.crypto.subtle.digest('SHA-256', data);
      };

      const base64encode = (input) => {
          return btoa(String.fromCharCode(...new Uint8Array(input)))
              .replace(/=/g, '')
              .replace(/\+/g, '-')
              .replace(/\//g, '_');
      };

      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64encode(hashed);

      const redirectUri = window.location.origin + "/?taggregator-auth=spotify.com";

      const scope = '';
      const authUrl = new URL("https://accounts.spotify.com/authorize");

      GM_setValue('spotifyAPICodeVerifier', codeVerifier);

      const params = {
          response_type: 'code',
          client_id: clientId,
          scope: scope,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
          redirect_uri: redirectUri,
      };

      authUrl.search = new URLSearchParams(params).toString();
      window.open(authUrl.toString(), '_blank').focus();

  }

  function handleSpotifyAuthRedirect(){
      const urlParams = new URLSearchParams(window.location.search);
      let code = urlParams.get('code');
      const redirectUri = window.location.origin + "/?taggregator-auth=spotify.com";
      console.log(redirectUri);
      const getToken = async (code) => {
          // stored in the previous step
          const codeVerifier = GM_getValue('spotifyAPICodeVerifier');
          const url = "https://accounts.spotify.com/api/token";
          const payload = {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                  client_id: clientId,
                  grant_type: 'authorization_code',
                  code: code,
                  redirect_uri: redirectUri,
                  code_verifier: codeVerifier,
              }),
          };
          const body = await fetch(url, payload);
          const response = await body.json();
          GM_setValue('spotifyAPIAccessToken', response.access_token);
          GM_setValue('spotifyAPIAccessTokenExpiry', Date.now() + response.expires_in);
          GM_setValue('spotifyAPIRefreshToken', response.refresh_token);
      };
      return getToken(code);
  }

  function spotifyNeedsAuthentication(){
      return !GM_getValue('spotifyAPIAccessToken');
  }

  function spotifyRefreshIfNeeded(){
      const getRefreshToken = async () => {

          // refresh token that has been previously stored
          const refreshToken = GM_getValue("spotifyAPIRefreshToken");
          const url = "https://accounts.spotify.com/api/token";

          const payload = {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: new URLSearchParams({
                  grant_type: 'refresh_token',
                  refresh_token: refreshToken,
                  client_id: clientId
              }),
          };
          const body = await fetch(url, payload);
          const response = await body.json();

          GM_setValue('spotifyAPIAccessToken', response.access_token);
          GM_setValue('spotifyAPIAccessTokenExpiry', Date.now() + response.expires_in);
          if (response.refresh_token) {
              GM_setValue('spotifyAPIRefreshToken', response.refresh_token);
          }
      };
      if(Date.now() >= GM_getValue('spotifyAPIAccessTokenExpiry')){
          return getRefreshToken();
      }else {
          return Promise.resolve();
      }
  }

  function fetchSpotifyTags(url, entity){
      const apiURL = "https://api.spotify.com/v1/artists/";
      let id = new URL(url).pathname.split('/')[2];
      const headers = new Headers();
      return spotifyRefreshIfNeeded()
          .then(() => {
              headers.append("Authorization", "Bearer " + GM_getValue('spotifyAPIAccessToken'));
              return fetch(apiURL+id, {headers: headers});
          })
          .then((response) => response.json())
          .then((data) => data.genres);
  }

  const spotify = { domain: "spotify.com",
                           fetchTags: fetchSpotifyTags,
                           supportedTypes: ["artist"],
                           needsAuthentication: spotifyNeedsAuthentication,
                           authenticate: spotifyAuthenticate,
                           redirectHandler: handleSpotifyAuthRedirect,};

  function fetchAllmusicTags(url, entity){
      return fetchAsHTML(url)
          .then((html) => {
              let tags = [];
              const pushTag = (aElement) => {
                  tags.push(aElement.textContent);
              };
              html.querySelectorAll(".genre a").forEach(pushTag);
              html.querySelectorAll(".styles a").forEach(pushTag);
              return tags;
          });
  }

  const allmusic = { domain: "allmusic.com",
                            fetchTags: fetchAllmusicTags,
                            supportedTypes: ["artist", "release-group"]};

  const sites = [bandcamp, discogs, wikidata, appleMusic, deezer, soundcloud, spotify, allmusic];

  function fixKeyframes(keyframesArray){
      keyframesArray.sort((a,b) => {
          return a.offset-b.offset;
      });
      // duplicate key frames if needed for offsets 0 & 1
      const hasFrom = keyframesArray[0].offset == 0;
      const hasTo = keyframesArray.at(-1).offset == 1;
      const from = Object.assign({}, keyframesArray[0]);
      const to = Object.assign({}, keyframesArray.at(-1));
      if(hasFrom && !hasTo){
          from.offset = 1;
          keyframesArray.push(from);
      }else if(!hasFrom && hasTo){
          to.offset = 0;
          keyframesArray.unshift(to);
      }else if(!hasFrom && !hasTo){
          from.offset = 0;
          keyframesArray.unshift(from);
          to.offset = 1;
          keyframesArray.push(to);
      }
      return keyframesArray;
  }

  function addCSSRules(){
      const iconContainerSize = 20;
      const sheet = new CSSStyleSheet();
      sheet.replace(`
.taggregator-icon-container {
  float: right;
  padding-right: ${iconContainerSize}px;
  position: relative;
}

.taggregator-icon-container > * {
  width: ${iconContainerSize}px;
  height: ${iconContainerSize}px;
}

.taggregator-loading-hexagon {
  position: absolute;
  background-color: #eb743b;
}

.taggregator-status-icon {
  height:${0.75 * iconContainerSize}px;
}

.taggregator-success-icon {
  fill: green;
}

.taggregator-error-icon {
  fill:red;
}

.taggregator-unsupported-icon {
  fill:grey;
}

`)
          .catch((error) => {
              console.error("Failed to replace styles:", error);
          });
      document.adoptedStyleSheets.push(sheet);
  }

  function getNewIconContainer(listItem){
      let container = listItem.querySelector("div.taggregator-icon-container");
      if(!container){
          container = document.createElement('div');
          container.className = "taggregator-icon-container";
          listItem.appendChild(container);
      }else {
          container.replaceChildren();
      }
      return container;
  }

  function displayLoadingIcon(listItem){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      container.title = `loading tags from ${host}`;
      
      for(let i=0; i < 6; i++){
          let element = document.createElement('div');
          container.appendChild(element);
          element.className = "taggregator-loading-hexagon";
          element.style.transform = "rotate(" + (i * 60) + "deg)";
          
          const smallTriangle = 'polygon(50% 50%, 50% 75%, 71.65% 62.5%)';
          const bigTriangle = 'polygon(50% 50%, 50% 100%, 93.3% 75%)';
          
          element.animate(fixKeyframes([
              { clipPath: smallTriangle, offset: i/6},
              { clipPath: bigTriangle, offset: ((i+1)/6)%1},
              { clipPath: smallTriangle, offset: ((i+2)/6)%1},
          ]),
                          {duration: 3000,
                           iterations: Infinity});
      }

      const placeholder = document.createElement('div');
      container.appendChild(placeholder);
  }

  const SVGPreambleLength = "data:image/svg+xml,".length;

  function displaySuccessIcon(listItem, tags){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      container.title = `loaded tags from ${host}: ${tags.toString()}`;
      
      container.innerHTML = decodeURIComponent(successIcon.substring(SVGPreambleLength));
      container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-success-icon");
  }

  function displayNeedsAuthIcon(listItem, authenticateFunction){
      const container = getNewIconContainer(listItem);
      const host = getHostFromListItem(listItem);
      container.title = `Click to authenticate with ${host}`;
      container.addEventListener("click", authenticateFunction);
      container.innerHTML = decodeURIComponent(authIcon.substring(SVGPreambleLength));
      container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-auth-icon");
  }

  function displayErrorIcon(listItem, error){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      container.title = `${host}: ${error.message}`;
      
      container.innerHTML = decodeURIComponent(errorIcon.substring(SVGPreambleLength));
      container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-error-icon");
  }

  function displaySiteNotSupportedIcon(listItem, entityType){
      const container = getNewIconContainer(listItem);

      const host = getHostFromListItem(listItem);
      let tooltip = `${host} not supported`;
      if(entityType){
          tooltip += ` for ${entityType} pages`;
      }
      container.title = tooltip;

      container.innerHTML = decodeURIComponent(siteUnsupportedIcon.substring(SVGPreambleLength));
      container.firstElementChild.setAttribute("class", "taggregator-status-icon taggregator-unsupported-icon");
  }

  function URLHostname(url){
      const urlObj = new URL(url);
      return urlObj.hostname;
  }

  function getHostFromListItem(li){
      return URLHostname(li.querySelector("a").href);
  }

  function matchesDomain(url, domain){
      return URLHostname(url).match(new RegExp("^(.+\\.)?" + domain));
  }

  function addTagsAndFocus(tags){
      const input = document.querySelector("input.tag-input");
      const textarea = document.querySelector("#tag-form textarea");
      let tagString = "";
      for(const tag of tags){
          tagString += tag + ",";
      }
      if(input){
          setReactInputValue(input, input.value + tagString);
          document.querySelector("#tag-form button").click();
          input.focus();
      }else if(textarea){
          setReactTextareaValue(textarea, textarea.value + tagString);
          document.querySelector("#tag-form button").click();
          textarea.focus();
      }
  }

  function importAllTags(){
      const allLinkListItems = document.querySelectorAll("ul.external_links li");
      let promises = [];
      const button = document.querySelector("#taggregator-import-button");
      button.disabled = true;
      const entityType = document.location.pathname.split('/')[1];
      for(const linkListItem of allLinkListItems){
          if(!linkListItem.closest("ul[class*=jesus2099_all-links]")){
              const url = linkListItem.querySelector("a").href;
              let matchedSite;
              for(const site of sites){
                  if(matchesDomain(url, site.domain)){
                      matchedSite = site;
                  }
              }
              if(matchedSite && matchedSite.supportedTypes.includes(entityType)){
                  if(matchedSite.needsAuthentication && matchedSite.needsAuthentication()){
                      displayNeedsAuthIcon(linkListItem, matchedSite.authenticate);
                  }else {
                      displayLoadingIcon(linkListItem);
                      promises.push(matchedSite.fetchTags(url, entityType)
                                    .then((tags) => {
                                        displaySuccessIcon(linkListItem, tags);
                                        return tags;
                                    })
                                    .catch((error) => {
                                        console.error(error);
                                        displayErrorIcon(linkListItem, error);
                                        // throw the error again since we need
                                        // to know if its an error later
                                        throw error;
                                    }));
                  }
              }else if(matchedSite){
                  displaySiteNotSupportedIcon(linkListItem, entityType);
              }
              else {
                  displaySiteNotSupportedIcon(linkListItem);
              }
          }
      }
      Promise.allSettled(promises).then((results) => {
          // use a Set since a user can only submit a tag once
          let tags = new Set();
          for(const result of results){
              if(result.status == "fulfilled"){
                  for(const tag of result.value){
                      tags.add(tag.toLowerCase());
                  }
              }
          }
          let finalTags = new Set();
          let aliasPromises = [];
          for(const tag of tags){
              aliasPromises.push(checkForGenreAlias(tag)
                                 .then((tag) => finalTags.add(tag)));
          }
          Promise.allSettled(aliasPromises).then(() => {
              addTagsAndFocus(finalTags);
              button.disabled = false;
          });
      });
  }

  function checkForGenreAlias(tag){
      const cacheNamespace = "MusicBrainzTagGenre:";
      const cached = GM_getValue(cacheNamespace + tag);
      const cacheLifetimeDays = 90;
      if(cached){
          if(cached.isGenre){
              return Promise.resolve(cached.value);
          }else if(Date.now() - cached.date < (1000 * 60 * 60 * 24 * cacheLifetimeDays)){
              return Promise.resolve(cached.value);
          }
      }
      const mbUrl = "https://musicbrainz.org/tag/";
      return fetchAsHTML(mbUrl + tag)
          .then((html) => {
              let genre = html.querySelector("a[href^=\"/genre/\"]");
              if(genre){
                  GM_setValue(cacheNamespace + tag, { value: genre.textContent,
                                                      isGenre: true,
                                                      date: Date.now()});
                  return genre.textContent;
              }else {
                  GM_setValue(cacheNamespace + tag, { value: tag,
                                                      isGenre: false,
                                                      date: Date.now()});
                  return tag;
              }
          })
          .catch((error) => {
              console.error(error);
              return tag;
          });
  }

  function addImportTagsButton(){
      let linksHeader = document.querySelector("#sidebar h2.external-links");
      if(!linksHeader){
          console.log("Taggregator bailing: entity has no links");
          return;
      }

      const input = document.querySelector("input.tag-input");
      const textarea = document.querySelector("#tag-form textarea");
      if(!input && ! textarea){
          console.log("Taggregator bailing: not logged in");
          return;
      }

      addCSSRules();
      
      let importButton = document.createElement('button');
      importButton.addEventListener("click", importAllTags);
      importButton.type = 'button';
      importButton.innerHTML = "Tag From All";
      importButton.id = "taggregator-import-button";
      importButton.className = 'styled-button';
      importButton.style.float = 'right';

      let importDiv = document.createElement("div");
      importDiv.style.display = "flex";
      importDiv.style.justifyContent = "center";
      importDiv.appendChild(importButton);

      let tagForm = document.querySelector("form#tag-form");
      if(tagForm){
          tagForm.insertAdjacentElement("afterend", importDiv);
      }
      linksHeader.insertAdjacentElement("beforebegin", importDiv);
  }

  const urlParams = new URLSearchParams(window.location.search);
  let auth = urlParams.get('taggregator-auth');
  for(const site of sites){
      if(auth == site.domain){
          site.redirectHandler()
              .then(() => {
                  window.close();
              });
      }
  }
  addImportTagsButton();

})();
