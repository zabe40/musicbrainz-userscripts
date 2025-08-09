const clientId = '2cd89e83465c42ecbc9fec4e01f84958';

async function spotifyAuthenticate(){
    console.log("authenticating spotify");
    const generateRandomString = (length) => {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce((acc, x) => acc + possible[x % possible.length], "");
    }

    const codeVerifier = generateRandomString(64);

    const sha256 = async (plain) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return window.crypto.subtle.digest('SHA-256', data);
    }

    const base64encode = (input) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

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
    const redirectUri = window.location.origin + "/?taggregator-auth=spotify.com"
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
        }
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
        }
        const body = await fetch(url, payload);
        const response = await body.json();

        GM_setValue('spotifyAPIAccessToken', response.access_token);
        GM_setValue('spotifyAPIAccessTokenExpiry', Date.now() + response.expires_in);
        if (response.refresh_token) {
            GM_setValue('spotifyAPIRefreshToken', response.refresh_token);
        }
    }
    if(Date.now() >= GM_getValue('spotifyAPIAccessTokenExpiry')){
        return getRefreshToken();
    }else{
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

export const spotify = { domain: "spotify.com",
                         fetchTags: fetchSpotifyTags,
                         supportedTypes: ["artist"],
                         name: "Spotify",
                         faviconClass: "spotify-favicon",
                         needsAuthentication: spotifyNeedsAuthentication,
                         authenticate: spotifyAuthenticate,
                         redirectHandler: handleSpotifyAuthRedirect,};
