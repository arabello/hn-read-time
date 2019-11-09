$(document).ready(function(){
    let eng = HNReadTime();
})

const HNReadTime = (options) => {
    let _opts = Object.assign({
        wpm: 265
    }, options);
    let crawler = ReadTimeCrawler(_opts.wpm);
    crawler.crawl(news => news.forEach(n => {
        console.log(n);
        let badgeContent = n.crawledReadTime || n.wordsReadTime;
        let badge = $("<td class='hnrt-badge'>"+ badgeContent  +"</td>");

        $(n.athing).append(badge);
    }));
};

const ReadTimeCrawler = (wpm) => {
    let athings = $('.athing');
    let news = $.map(athings, elem => ({
        athing: elem, 
        url: $(elem).find('.storylink').first().attr('href')
    }));

    let fetchTask = (urls, onProgress, onFinish) => {
        let start = Date.now();
        let port = chrome.runtime.connect({name: "hn-read-time"});
        var stop = urls.length;

        $.each(urls, (i, elem) => {
            port.postMessage({id: i, url: elem});
            port.onMessage.addListener( msg => {
                if (i !== msg.id)
                    return;
                
                stop--;

                if (onProgress){
                    onProgress({id: i, url: elem, payload: msg.payload});
                    if (onFinish && stop == 0)
                        onFinish(Date.now() - start);
                }
            });
        });
    }

    let getMetrics = (htmlString, wpm) => {
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
            return found ? parseInt(found[0].match(/\d+/)[0]) : null;
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

    return {
        crawl: (onComplete) => fetchTask(
            news.map(n => n.url), 
            result => news[result.id] = Object.assign(news[result.id], getMetrics(result.payload, wpm)),
            millis => onComplete(news)
        )
    }
}

