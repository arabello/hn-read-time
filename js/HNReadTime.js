$(document).ready( () => chrome.storage.sync.get('userSettings', storage => {
        let userSettings = storage.userSettings;
        Object.keys(userSettings).map((k,i) => userSettings[k] = userSettings[k].value);

        let eng = HNReadTime(userSettings);

        chrome.storage.local.get('actions', 
            results => eng.fetchAll(
                elem => eng.render(results.actions),
                () => console.log('Completed')
            )
        );

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace != 'local')
                return;

            eng.render(changes['actions'].newValue)
        });
    })
);

const HNReadTime = (opts) => {
    let _crawler = ReadTimeCrawler(opts.wpm);
    let _render = ReadTimeRender('hnrt-badge', opts.placeholder, opts.animDuration);
    let _data = $.map($("tr[class='athing']"), (elem, i) => ({
        index: i,
        url: $(elem).find('.storylink').first().attr('href'),
        container: elem,
        container_sibilings: $(elem).nextUntil("tr[class='athing'], tr[class='morespace']"),
        badge: _render.initTarget(elem),
        filtered: true,
        fetched: false
    }));
    let _contentTail = [$("tr[class='morespace']"), $("tr[class='morespace']").next()];

    let _fetch = (elem, callback) => _crawler.crawl(elem.url, metrics => {
        elem.value = metrics.crawledReadTime || metrics.wordsReadTime;
        elem.isCrawled = metrics.crawledReadTime ? true : false;
        elem.fetched = true;
        let classes = elem.isCrawled ? ['hnrt-crawled'] : [];
        _render.render(elem.badge, elem.value, classes);
        callback(elem);
    });


    let _sort = (type) => {
        switch(type){
            case 'none':
                _data.sort((a, b) => a.index - b.index);
                break;
            case 'ascending':
                _data.sort((a, b) => a.value ? a.value - b.value : b.value);
                break;
            case 'descending':
                _data.sort((a, b) => b.value ? b.value - a.value : a.value);
                break;
        }
    }

    let _filter = (topLimit) => {
        topLimit = parseInt(topLimit);
        if (topLimit < 0){
            _data.forEach(elem => elem.filtered = true);
            return;
        }

        _data.forEach(elem => elem.filtered = elem.value <= topLimit);
    }
    
    return {
        fetchAll: (onProgress= () => {}, onComplete=()=>{}) => {
            var c = 0;
            _data.forEach(e => _fetch(e, elem => {
                c = c+1;
                onProgress(elem);
                if (c == _data.length-1)
                    onComplete();
            }));
        },
        render: (actions) => {
            _sort(actions.sort)
            _filter(actions.filter);

            let target = $("table[class='itemlist']").find('tbody');
            target.empty();
             _data.forEach(elem => {
                 if (!elem.filtered)
                     return;

                 target.append(elem.container).append(elem.container_sibilings);

             });

            $(target).append(_contentTail);
            _data.forEach(e => actions.showBadge ? $(e.badge).show() : $(e.badge).hide());
        }
    }
};

const ReadTimeRender = (itemClass, placeholder, animDuration) => {
    let _createTarget = (classes, content) =>
        $("<td class='"+ classes.join(' ')  +"' align='right'>"+ content  +"</td>");

    let _init = (container) => {
        $(container).find(itemClass).remove();
        let target = _createTarget([itemClass], '');
        $(container).append(target);
        return target;
    };

    let _update = (target, value, classes=[]) => {
        let unit = value ? "'" : '';
        let content = (value || placeholder) + unit;
        $(target).addClass(classes.join(' ')).text(content);
    }

    return{
        initTarget: (athing) => _init(athing),
        render: (target, value, classes) => _update(target, value, classes),
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
    let _crawlTimeRegExp = /\d+\smin.?\sread|read\stime\s\d+|\d+\sminutes?\sread/i;
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
