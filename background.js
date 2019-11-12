let storage = {
    wpm: {
        value: 265,
        allow_tuning: false,
        title: "Words per minute",
        desc: "Used by the engine to estimate the read time based on the article webpage content"
    },
    animDuration: {
        value: 350,
        allow_tuning: true,
        title: "Animation duration",
        desc: "Smooth data entrance in millis"
    },
    placeholder: {
        value: "¯\\_(ツ)_/¯",
        allow_tuning: true,
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

