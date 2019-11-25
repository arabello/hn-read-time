$(document).ready(() => chrome.storage.local.get('actions', (results) => {
    let actions = results['actions'];
    let sortState = ['none', 'ascending', 'descending'];
    let sortStateIndex = sortState.indexOf(actions.sort);
    let btnSortState = Iterator(sortState, sortStateIndex);

    // Sort button
    $('#btn-sort').text(sortState[sortStateIndex]);
    $('#btn-sort').on('click', () =>{
        let type = btnSortState.next();
        actions.sort = type;
        chrome.storage.local.set({'actions': actions});
        $('#btn-sort').text(type);
    });

    // Enable button
    $('#btn-enable').bootstrapToggle(actions.enable ? 'on' : 'off');
    $('#btn-enable').change(function(){
        actions.enable = $(this).prop('checked');
        chrome.storage.local.set({'actions': actions});
    });

    // Options link
    $('#btn-options').on('click', () => chrome.runtime.openOptionsPage());
}));

const Iterator = (states, initIndex=0) => {
    let _counter = initIndex;

    return {
        next: () => {
            _counter += 1;
            if (_counter >= states.length)
                _counter = 0;
            return states[_counter];
        }
    }
}
