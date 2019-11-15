$(document).ready(() => {
    let render = OptionsRender();
    chrome.storage.sync.get(null, opts =>{
        render.render(opts, 'container');
    });
});

const OptionsRender = () => {
    let factory = FormFactory();

    return {
        render: (opts, idTarget) => $('#'+idTarget).append(Object.keys(opts).map(k => factory.makeFormGroup(
            factory.makeLabel(k, opts[k].title, ['col-8']),
            factory.makeInput(k, opts[k].value, ['col-4'])
        )))
    }
}

const FormFactory = () => ({
    makeInput: (id, value='', classes=[], type='text') => 
        $('<input>')
        .attr('id' , id)
        .attr('type', type)
        .attr('value', value)
        .addClass(classes.concat('form-control').join(' ')),

    makeLabel: (forwho, content, classes=[]) =>
        $('<label></label>')
        .attr('for', forwho)
        .addClass(classes.concat('col-form-label'))
        .text(content),

    makeFormGroup: (label, input) =>
        $("<div class='form-group row'></div>")
        .append(label)
        .append(input),

    makeForm: (...formGroups) => {
        let form = $("<form></form>");
        formGroups.forEach(x => $(form).append(x));
        return $(form);
    }
})
