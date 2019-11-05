$(document).ready(function(){
    let eng = HNReadTime();

    let port = chrome.runtime.connect({name: "crawler"});
    port.postMessage({url: "https://www.theguardian.com/world/2019/nov/01/undercover-reporter-reveals-life-in-a-polish-troll-farm"})
    port.onMessage.addListener( msg => {
        console.log(body);
        let innerText = body.text();
        let wordscount = innerText.match(/\S+/g).length
        console.log(wordscount);
    } );
})

const HNReadTime = (options) => {
    let opts = {
        wpm: 265
    };
    Object.assign(opts, options);

    let articles = $('.title');

    function computeReadTime(content){
    }

    return {
    }
};
