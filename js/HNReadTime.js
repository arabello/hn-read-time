$(document).ready( () => chrome.storage.sync.get('userSettings', storage => {
        let userSettings = storage.userSettings;
        Object.keys(userSettings).map((k,i) => userSettings[k] = userSettings[k].value);
        let eng = HNReadTime(userSettings);

        eng.render();
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace != 'local')
                return;

            eng.handle(changes['actions'].newValue)
        });
    })
);

const HNReadTime = (opts) => {
    let _visibility = true;
    let _crawler = ReadTimeCrawler(opts.wpm);
    let _render = ReadTimeRender('hnrt-badge', opts.placeholder, opts.animDuration);
    let _data = $.map($("tr[class='athing']"), (elem, i) => ({
        index: i,
        url: $(elem).find('.storylink').first().attr('href'),
        container: elem,
        container_sibilings: $(elem).nextUntil("tr[class='athing']"),
        badge: _render.initTarget(elem)
    }));

    let _fetch = (elem, callback) =>_crawler.crawl(elem.url, metrics => {
        elem.value = metrics.crawledReadTime || metrics.wordsReadTime;
        elem.isCrawled = metrics.crawledReadTime ? true : false;
        callback(elem);
    });

    let _update = (elem) => {
        let classes = elem.isCrawled ? ['hnrt-crawled'] : []
        if (_visibility)
            _render.render(elem.badge, elem.value, classes);
    }

    let _setVisibility = (value) => {
        _visibility = value;
        _data.forEach(e => _visibility ? _update(e) : $(e.badge).fadeOut(opts.animDuration));
    }

    let _sort = (type) => {
        let copy = _data.slice();
        // TODO: Don't affect the more link in the end of the page
        let morelink = copy[copy.length-1].container_sibilings[copy[copy.length-1].container_sibilings.length -1];
        copy[copy.length-1].container_sibilings.splice(copy[copy.length-1].container_sibilings.length-1 ,1);
        let target = $("table[class='itemlist']").find('tbody');
        target.empty();
        switch(type){
            case 'ascending':
                copy.sort((a, b) => a.value - b.value);
                break;
            case 'descending':
                copy.sort((a, b) => b.value - a.value);
                break;
        }
        copy.forEach(elem => target.append(elem.container).append(elem.container_sibilings));
        target.append(morelink);
    }
    
    return {
        render: () => _data.forEach(e => _fetch(e, (elem) => _update(elem))),
        handle: (actions) => {
            _sort(actions.sort)
            _setVisibility(actions.enable);
        }
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
        render: (target, value) => _update(target, value),
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
