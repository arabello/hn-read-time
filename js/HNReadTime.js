$(document).ready( () => chrome.storage.sync.get('userSettings', storage => {
        let userSettings = storage.userSettings;
        Object.keys(userSettings).map((k,i) => userSettings[k] = userSettings[k].value);
        let eng = HNReadTime(userSettings);
        
        chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
            console.log(sender.tab ?
                        "from a content script:" + sender.tab.url :
                        "from the extension");
            if (request.greeting == "hello")
              sendResponse({farewell: "goodbye"});
          });
    })
);

const HNReadTime = (opts) => {
    let _itemClass = 'hnrt-badge';
    let _onDataReady = n => {
        let badgeClasses = [_itemClass]
        let badgeContent = n.crawledReadTime || n.wordsReadTime;
        
        if (badgeContent == null)
            badgeContent = opts.placeholder;

        if (n.crawledReadTime)
            badgeClasses.push('hnrt-crawled');

        let badge = $("<td class='"+ badgeClasses.join(' ')  +"' align='right'>"+ badgeContent  +"</td>");

        $(badge).hide().fadeIn(opts.animDuration);
        $(n.athing).append(badge);
    }

    let _crawler = ReadTimeCrawler(opts.wpm);
    _crawler.crawl(_onDataReady, (news, millis) => console.log('Crawling done in ' + millis));

    let _setVisibility = (visible) => {
        if (visibile)
            $('.'+_itemClass).hide();
        else
            $('.'+_itemClass).show();
    }

    return {
        show: () => _setVisibility(true),
        hide: () => _setVisibility(false)
    }
};

const ReadTimeCrawler = (wpm) => {
    let athings = $("tr[class='athing']");
    let news = $.map(athings, elem => ({
        athing: elem, 
        url: $(elem).find('.storylink').first().attr('href')
    }));

    let fetchTask = (urls, onProgress, onFinish) => {
        let start = Date.now();
        let port = chrome.runtime.connect({name: "content-script"});
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
        crawl: (onProgress, onComplete) => fetchTask(
            news.map(n => n.url), 
            result => {
                news[result.id] = Object.assign(news[result.id], getMetrics(result.payload, wpm));
                if (onProgress)
                    onProgress(news[result.id]);
            },
            millis => onComplete ? onComplete(news, millis) : {}
        )
    }
}

