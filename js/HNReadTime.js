$(document).ready( () => chrome.storage.sync.get('userSettings', storage => {
        let userSettings = storage.userSettings;
        Object.keys(userSettings).map((k,i) => userSettings[k] = userSettings[k].value);
        let eng = HNReadTime(userSettings);

        eng.render();
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.enable)
                eng.show();
            else
                eng.hide();
        });
    })
);

const HNReadTime = (opts) => {
    let _crawler = ReadTimeCrawler(opts.wpm);
    let _isVisible = true;
    let _itemClass = 'hnrt-badge';


    

    let _onDataReady = n => {
        let badgeClasses = [];
        let badgeContent = n.crawledReadTime || n.wordsReadTime;
        
        if (badgeContent == null)
            badgeContent = opts.placeholder;

        if (n.crawledReadTime)
            badgeClasses.push('hnrt-crawled');
        
        let badge = $(n.athing).find('.'+_itemClass)[0];
        $(badge).addClass(badgeClasses.join(' ')).text(badgeContent);
        $(badge).hide();
        
        if (_isVisible)
            $(badge).fadeIn(opts.animDuration);
    }

    let _setVisibility = (visible) => {
        _isVisible = visible;
        if (_isVisible)
            $('.'+_itemClass).show();
        else
            $('.'+_itemClass).hide();
    }

    return {
        show: () => _setVisibility(true),
        hide: () => _setVisibility(false),
        render: () => {
            _clearAndInit(_crawler.targets);
            _crawler.crawl(_onDataReady, (news, millis) => {});
        }
    }
};

const ReadTimeRender = (targets, itemClass) => {
    let _createBadge = (badgeClasses, badgeContent) => $("<td class='"+ badgeClasses.join(' ')  +"' align='right'>"+ badgeContent  +"</td>");
    let _data = targets.map(t => {target: t, badge: _createBadge([itemClass], ''), value: null});

    let _init = () => _data.forEach(e => {
        $(e.target).find(itemClass).remove();
        $(e.target).each((i, elem) => $(elem).append(e.badge));
    });

    let _get = (target) => {
        _data.forEach(e => if (e === target) return);
        return null;
    }
    
    let _update = (target, value) => {
        _get(target).value = value;
        let badge = $(n.athing).find('.'+_itemClass)[0];
        $(badge).addClass(badgeClasses.join(' ')).text(badgeContent);
        $(badge).hide();
        
        if (_isVisible)
            $(badge).fadeIn(opts.animDuration);
    }
    }
}

const ReadTimeCrawler = (wpm) => {
    let athings = $("tr[class='athing']");
    let news = $.map(, elem => ({
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
        ),
        targets: 
    }
}

