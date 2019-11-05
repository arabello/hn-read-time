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

