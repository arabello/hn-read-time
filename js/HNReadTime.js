$(document).ready( () => chrome.storage.sync.get('userSettings', storage => {
        let userSettings = storage.userSettings;
        Object.keys(userSettings).map((k,i) => userSettings[k] = userSettings[k].value);
        let eng = HNReadTime(userSettings);

        eng.render();
        
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.enable)
                eng.refresh();
            else
                eng.hide();
        });
    })
);

const HNReadTime = (opts) => {
    let _crawler = ReadTimeCrawler(opts.wpm);
    let _render = ReadTimeRender('hnrt-badge', opts.placeholder, opts.animDuration);
    let _data = $.map($("tr[class='athing']"), elem => ({
        url: $(elem).find('.storylink').first().attr('href'),
        container: elem
    }));

    let _init = () => _data.forEach(elem => elem.badge = _render.initTarget(elem.container));

    let _update = (elem) => _crawler.crawl(elem.url, metrics => {
        elem.value = metrics.crawledReadTime || metrics.wordsReadTime;
        
        let badgeClasses = [];
        if (metrics.crawledReadTime)
            badgeClasses.push('hnrt-crawled');
        
        _render.update(elem.badge, elem.value, badgeClasses);
    });

    let _updateAll = () => _data.forEach(elem => _update(elem));

    return {
        render: () => {
            _init();
            _updateAll();
        },
        refresh: () => _updateAll(),
    }
};

const ReadTimeRender = (itemClass, placeholder, animDuration) => {
    let _createTarget = (classes, content) =>
        $("<td class='"+ classes.join(' ')  +"' align='right'>"+ content  +"</td>");

    let _init = (container) => {
        $(container).find(itemClass).remove();
        let target = _createTarget([itemClass], '');
        $(target).hide();
        $(container).append(target);
        return target;
    };

    let _update = (target, value, classes=[]) => {
        let unit = value ? "'" : '';
        let content = (value || placeholder) + unit
        $(target).addClass(classes).text(content);
        $(target).fadeOut(animDuration/4);
        $(target).fadeIn(3*animDuration/4);
    }

    return{
        initTarget: (athing) => _init(athing),
        update: (target, value) => _update(target, value)
    }
}

const ReadTimeCrawler = (wpm) => {
    let fetchTask = (url, callback) => {
        let port = chrome.runtime.connect({name: "content-script"});
        port.postMessage({url: url});
        port.onMessage.addListener(msg => callback(msg.payload));
    }

    return {
        crawl: (url, callback) => fetchTask(
            url, 
            payload => callback(ComputeMetrics(payload, wpm))
        )
    }
}

const ComputeMetrics = (htmlString, wpm) => {
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
