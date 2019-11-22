$(document).ready(() => chrome.storage.local.get('actions', (results) => {
    let actions = results['actions'];
    $('#btn-options').on('click', () => chrome.runtime.openOptionsPage());
    $('#btn-enable').bootstrapToggle(actions.enable ? 'on' : 'off');
    $('#btn-enable').change(function(){
        actions.enable = $(this).prop('checked');
        chrome.storage.local.set({'actions': actions});
    });
}));
