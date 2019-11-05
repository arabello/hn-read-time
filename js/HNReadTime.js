$(document).ready(function(){
    let eng = HNReadTime();

    let port = chrome.runtime.connect({name: "crawler"});
    port.postMessage({url: "https://medium.com/@marksaroufim/how-to-turn-physics-into-an-optimization-problem-11b3fbf83062"})
    port.onMessage.addListener( msg => {
        console.log(MetricsTask(msg.resp, 265));
    } );
})

const HNReadTime = (options) => {
    let _opts = {wpm: 265};
    Object.assign(_opts, options);
};

const MetricsTask = (htmlString, wpm) => {
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
