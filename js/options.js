$(document).ready(() => {
    let render = OptionsRender($('#options-container'));
    chrome.storage.sync.get(null, opts =>{
        render.render(opts);
    });
});

const OptionsRender = (target) => {
    let _factory = FormFactory();
    let _createSetting = (id, setting) => {
        let isAdvancedClass = setting.is_advanced ? 'is-advanced' : '';
        let label = _factory.makeLabel(id, setting.title, ['col-8']);
        $(label).append('<p>'+setting.desc+'</p>');
        return _factory.makeFormGroup(
            label,
            _factory.makeInput(id, setting.value, ['col-4'], setting.type),
            [isAdvancedClass, 'hnrt-sett']
        )
    }

    let _addAdvanceBtn = (form) =>{
        let advBtnGroup =_factory.makeFormGroup(
            _factory.makeLabel('adv-btn', 'Show advanced settings', ['col-8']),
            _factory.makeInput('adv-btn', '', [], 'checkbox')
        );

        $(form).prepend(advBtnGroup);
        $(form).find('#adv-btn').first().bootstrapToggle({
            on: 'Advanced',
            off: 'Basic',
            style: 'col-2'
        });
        $(form).find('#adv-btn').first().change(()=>_showAdvanced($("#adv-btn").prop('checked')));
        return $(form).find('#adv-btn');
    }

    let _showAdvanced = show => {
        if (show){
            $(target).find('.is-advanced').removeClass('d-none');
        }else{
            $(target).find('.is-advanced').addClass('d-none');
        }
    }

    return {
        render: (opts) => {
            $(target).empty();
            let settings = Object.keys(opts).map(k => _createSetting(k, opts[k]))
            let form = _factory.makeForm(settings);
            let advBtn = _addAdvanceBtn(form);
            $(target).append(form);
            _showAdvanced(advBtn.prop('checked'))
        },
        showAdvanced: show => _showAdvanced(show)
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
        .addClass(classes.concat('col-form-label').join(' '))
        .text(content),

    makeFormGroup: (label, input, classes=[]) =>
        $("<div class='form-group row'></div>")
        .addClass(classes.join(' '))
        .append(label)
        .append(input),

    makeForm: (...formGroups) => {
        let form = $("<form></form>");
        formGroups.forEach(x => $(form).append(x));
        return $(form);
    }
})
