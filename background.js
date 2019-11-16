let storage = {
    wpm: {
        type: "number",
        value: 265,
        is_advanced: true,
        title: "Words per minute",
        desc: "Affect the article read time estimation"
    },
    animDuration: {
        type: "number",
        value: 350,
        is_advanced: false,
        title: "Animation duration",
        desc: "Smooth data entrance in millis"
    },
    placeholder: {
        type: "text",
        value: "¯\\_(ツ)_/¯",
        is_advanced: false,
        title: "Error placeholder",
        desc: "What to show when the engine cannot estimate the read time"
    }
}


chrome.runtime.onInstalled.addListener( details => {
    if (details.reason == "install")
        chrome.storage.sync.set(storage);
});

chrome.runtime.onConnect.addListener( port => {
    if (port.name == "hn-read-time")
        port.onMessage.addListener( msg => {
            $.ajax({
                url: msg.url
            }).done( (data, textStatus, jqXHR) => 
                port.postMessage({id: msg.id, payload: data})
            );   
        });
});

