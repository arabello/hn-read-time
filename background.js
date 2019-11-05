chrome.runtime.onConnect.addListener( port => {
    if (port.name == "crawler")
        port.onMessage.addListener( msg => {
            $.ajax({
                url: msg.url
            }).done( (data, textStatus, jqXHR) => port.postMessage({resp: data}));   
        });
});

