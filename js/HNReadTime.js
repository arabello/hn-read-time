$(document).ready(function(){
    let eng = HNReadTime();

    })

const HNReadTime = (options) => {
    let _opts = {wpm: 265};
    Object.assign(_opts, options);
    
    let news = $('.athing');
    let urls = $.map(news.find('.storylink'), (elem) => $(elem).attr('href'));
    fetchTask(urls, result => {
        let metrics = getMetrics(result.payload, _opts.wpm);
        console.log(result.url + ' ' + metrics.wordsReadTime + ' ' + metrics.crawledReadTime);
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
                onProgress({id: i, url: elem, payload: msg.payload});
        });
    });
    if (onFinish) 
        onFinish(Date.now() - start);
}

const getMetrics = (htmlString, wpm) => {
    let _wordsRegExp = /\S+/g;
    let _crawlTimeRegExp = /\d+\smin.?\sread|read\stime\s\d+|\d+\sminutes\sread\stime/i;
    let _parser = new DOMParser();
    let _html = _parser.parseFromString(htmlString, 'text/html');
    let _body = $(_html.getElementsByTagName('body')[0]);

    let _wordsCount = body => {
        let simpler = body;
        simpler.find('script, style, link, img').remove();
        let words = simpler.text().match(_wordsRegExp);
        return words ? words.length : null
    }
   
    let _hardWordsCount = body => {
        let tempDOM = $('<div></div>').append(_body);
        let words = tempDOM.text().match(_wordsRegExp);
        return words ? words.length : null
    }

    let _wordsReadTime = wordsCount => Math.round(wordsCount/wpm);
    let _crawledReadTime = body => {
        let found = body.text().match(_crawlTimeRegExp);
        return found ? found[0].match(/\d+/)[0] : null;
    }

    return {
        wordsReadTime: (function(){
            var wordsCount = _wordsCount(_body);
            if (wordsCount == null)
                wordsCount = _hardWordsCount(_body);
            return wordsCount ? _wordsReadTime(wordsCount) : null;
        })(),
        crawledReadTime: _crawledReadTime(_body)
    }
}
