$(document).ready(() => chrome.storage.sync.get(null, opts =>{
    

    let makeInput = (id, value='', classes=[], type='text') => 
        $('<input>')
        .attr('id' , id)
        .attr('type', type)
        .attr('value', value)
        .addClass(classes.concat('form-control').join(' '))

    let makeLabel = (forwho, content, classes=[]) =>
        $('<label></label>')
        .attr('for', forwho)
        .addClass(classes.concat('col-form-label'))
        .text(content)

    let makeFormGroup = (label, input) =>
        $("<div class='form-group row'></div>")
        .append(label)
        .append(input)

    let makeSettings = opts => Object.keys(opts).map(k => makeFormGroup(
        makeLabel(k, opts[k].title, ['col-8']),
        makeInput(k, opts[k].value, ['col-4'])
    ));

    $('#options').append(makeSettings(opts));
}));
