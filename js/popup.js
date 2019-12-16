$(document).ready(() => chrome.storage.local.get('actions', (results) => {
    let actions = results['actions'];
    let sortState = ['none', 'ascending', 'descending'];
    let sortStateIndex = sortState.indexOf(actions.sort);
    let btnSortState = Iterator(sortState, sortStateIndex);

    // Show user placeholder as legend
    chrome.storage.sync.get('userSettings', results => {
        settings = results['userSettings'];
        placeholder = settings.placeholder.value;
        console.log(placeholder);
        $('#legend-placeholder').text(placeholder);
    });
    
    // Filter
    $("#filter").val(actions.filter);
    $("#filter").on('change', () => {
        actions.filter = $("#filter").val() < 0 ? -1 : $("#filter").val();
        save(actions);
    });
    $("#filter-reset").on('click', () => {
        actions.filter = -1;
        $("#filter").val(-1);
        save(actions);
    });

    // Sort button
    $('#btn-sort').text(sortState[sortStateIndex]);
    $('#btn-sort').on('click', () =>{
        let type = btnSortState.next();
        actions.sort = type;
        save(actions);
        $('#btn-sort').text(type);
    });

    // Enable button
    $('#btn-show-badge').bootstrapToggle(actions.showBadge ? 'on' : 'off');
    $('#btn-show-badge').change(function(){
        actions.showBadge = $(this).prop('checked');
        save(actions);
    });

    // Options link
    $('#btn-options').on('click', () => chrome.runtime.openOptionsPage());
}));

const save = (actions) => chrome.storage.local.set({'actions': actions})

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


// Standard Google Universal Analytics code

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){

(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),

m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)

})(window,document,'script','https://www.google-analytics.com/analytics.js','ga'); // Note: https protocol here

ga('create', 'UA-58567975-5', 'auto');

ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200

ga('require', 'displayfeatures');

ga('send', 'pageview', '/popup.html');

