$(document).ready(function(){
    let actions = {
        enable: true
    };
    $('#btn-options').on('click', () => chrome.runtime.openOptionsPage());
    $('#btn-enable').change(function(){
        actions.enable = $(this).prop('checked');
        signalContentScript(actions);
    });
});

const signalContentScript = (actions) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, actions, function(response) {
            console.log(response);
        });
    });
}
