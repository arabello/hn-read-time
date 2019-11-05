$(document).ready(function(){
    let eng = HNReadTime();

    })

const HNReadTime = (options) => {
    let _opts = {wpm: 265};
    Object.assign(_opts, options);
    
    let urls = $.map($('.storylink'), (elem) => $(elem).attr('href'));
    fetchTask(urls, (id, payload) => {
        let metrics = getMetrics(payload, _opts.wpm);
        console.log(id, metrics);
    });
};

const fetchTask = (urls, onProgress, onFinish) => {
    let start = Date.now();
    let port = chrome.runtime.connect({name: "hn-read-time"});
    $.each(urls, (i, elem) => {
        port.postMessage({id: i, url: elem});
        port.onMessage.addListener( msg => {
            if (i !== msg.id)
                return;

            if (onProgress)
                onProgress(i, msg.payload);
        });
    });
    if (onFinish) 
        onFinish(Date.now() - start);
}

const getMetrics = (htmlString, wpm) => {
    let _parser = new DOMParser();
    let _html = _parser.parseFromString(htmlString, 'text/html');
    let _body = $(_html.getElementsByTagName('body')[0]);
    _body.find('script, style, link, img').remove();

    let _wordsCount = (body) => body.text().match(/\S+/g).length
    let _wordsReadTime = (wordsCount) => Math.round(wordsCount/wpm);
    let _crawledReadTime = (body) => {
        let found = body.text().match(/\d+\smin.?read|read\stime\s\d+/i);
        if (found)
            found = found[0].match(/\d+/)[0];
        return found;
    }

    return {
        wordsReadTime: _wordsReadTime(_wordsCount(_body)),
        crawledReadTime: _crawledReadTime(_body)
    }
}
