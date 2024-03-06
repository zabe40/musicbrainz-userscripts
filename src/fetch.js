export function fetchURL(url, options){
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            url: url,
            onload: function(response){
                if(400 <= response.status){
                    reject(new Error(`HTTP error! Status: ${response.status}`,
                                     { cause: response}));
                }else{
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

export function fetchAsHTML(url, options){
    return fetchURL(url, options)
        .then((response) => {
            const html = response.responseText;
            const parser = new DOMParser();
            return parser.parseFromString(html, "text/html");
        })
}
