export function fetchURL(url, options){
    return new Promise((resolve, reject) => {
	GM_xmlhttpRequest({
	    url: url,
	    onload: function(response){
		if((200 <= response.status) && (response.status <= 299)){
		    resolve(response);
		}else{
		    reject({reason: 'httpError', response: response});
		}
	    },
	    onabort: function(...errors){
		reject({reason: 'abort', info: errors})
	    },
	    onerror: function(...errors){
		reject({reason: 'error', info: errors})
	    },
	    ontimeout: function(...errors){
		reject({reason: 'timeout', info: errors})
	    },
	    ...options,
	});
    });
}
