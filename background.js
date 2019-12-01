let storage = {
    defaultSettings: {
        wpm: {
            type: "number",
            value: 265,
            isAdvanced: true,
            title: "Words per minute",
            desc: "Affect the article read time estimation"
        },
        animDuration: {
            type: "number",
            value: 350,
            isAdvanced: false,
            title: "Animation duration",
            desc: "Smooth data entrance in millis"
        },
        placeholder: {
            type: "text",
            value: "¯\\_(ツ)_/¯",
            isAdvanced: false,
            title: "Error placeholder",
            desc: "What to show when the engine cannot estimate the read time"
        }
    }
}

let localStorage = {
    actions:{
        showBadge: true,
        sort: 'none',
        filter: -1 // don't filter
    }
}

let ports = []; // Required avoid port destroying by GB

chrome.runtime.onInstalled.addListener( details => {
    if (details.reason == "install"){
        storage['userSettings'] = {};
        Object.assign(storage['userSettings'], storage['defaultSettings']);
        chrome.storage.sync.set(storage);
        chrome.storage.local.set(localStorage);
    }

    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        let manifest = chrome.runtime.getManifest();
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: {urlMatches: '(news.ycombinator.(com|net|org))|(hackerne.ws)'}
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


chrome.runtime.onConnect.addListener( port => {
    ports.push(port);
    switch(port.name){
        case "content-script":
            port.onMessage.addListener( msg => {
                $.ajax({
                    url: msg.url
                }).done( (data, textStatus, jqXHR) => 
                    port.postMessage({url: msg.url, payload: data})
                );   
            });
            break;
    }
});

