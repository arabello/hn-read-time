let options = {
    wpm: 265,
    animDuration: 350,
    placeholder: "¯\\_(ツ)_/¯"
}


chrome.runtime.onInstalled.addListener( details => {
    
    if (details.reason == "install")
        chrome.storage.sync.set(options);
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

