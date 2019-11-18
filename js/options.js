$(document).ready(() => {
    chrome.storage.sync.get(['defaultSettings', 'userSettings'], storage => {
        let render = OptionsRender(storage.defaultSettings, $('#options-container'));
        render.onSave(newOpts => chrome.storage.sync.set({'userSettings': newOpts}, () => console.log('Data saved!')));
        render.render(storage.userSettings);
    });
});

const OptionsRender = (defaultSettings, target) => {
    let _state = {
        showAdvancedSettings: false
    }

    let _factory = FormFactory();
    let _createSetting = (id, setting) => {
        let isAdvancedClass = setting.isAdvanced ? 'is-advanced' : '';
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
        _state.showAdvancedSettings = show;
        if (show){
            $(target).find('.is-advanced').removeClass('d-none');
        }else{
            $(target).find('.is-advanced').addClass('d-none');
        }
    }

    let _getNewOptions = opts => {
        let newOptions = {}
        Object.assign(newOptions, opts);
        for(let key in newOptions){
            let id = '#'+key
            newOptions[key].value = $(id).attr('type') == 'number' ? parseInt($(id).val()) : $(id).val();
        }
        return newOptions;
    }

    let _setNewOptions = newOptions => {
        for(let key in newOptions){
            let id = '#'+key
            $(id).val(newOptions[key].value);
        }
    }

    let _showMessage = (message, alertType) => {
        $(target).find('.msg').remove();
        let msg = $('<div></div>').addClass('msg alert alert-'+alertType).text(message);
        $(target).append(msg);
        $(msg).hide().fadeIn(400).delay(2500).fadeOut(150, function(){$(this).remove()});
    }

    var _onSaveHandler = () => {};

    return {
        onSave: (callbak) => _onSaveHandler = callbak,
        render: (opts) => {
            $(target).empty();
            let settings = Object.keys(opts).map(k => _createSetting(k, opts[k]))
            let form = _factory.makeForm(settings);
            let advBtn = _addAdvanceBtn(form);
            let saveBtn = _factory.makeButton(
                'save-btn',
                'Save', 
                () => {
                    _onSaveHandler(_getNewOptions(opts));
                    _showMessage('Settings saved successfully!', 'success')
                }, 
                ['col-3 offset-6', 'btn btn-success']
            );
            let restoreBtn = _factory.makeButton(
                'restore-btn',
                'Restore', 
                () => {
                    _setNewOptions(defaultSettings);
                    _showMessage('Settings restored, save to apply changes!', 'info');
                },
                ['col-3', 'btn btn-info']
            );
            $(form).append(_factory.makeFormGroupFree(restoreBtn, saveBtn));
            $(target).append(form);
            _showAdvanced(advBtn.prop('checked'))
        },
        showAdvanced: show => _showAdvanced(show)
    }
}

const FormFactory = () => ({
    makeButton: (id, label='', onclick=()=>{}, classes=[]) =>
        $('<button>'+label+'</button>')
        .attr('id' , id)
        .addClass(classes.concat('btn').join(' '))
        .on('click', onclick),

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

    makeFormGroupFree: (...children) => {
        let grp = $("<div class='form-group row'></div>");
        $.each(children, (i, elem) => $(grp).append(elem.addClass('form-control')));
        return grp;
    },

    makeFormGroup: (label, input, classes=[]) =>
        $("<div class='form-group row'></div>")
        .addClass(classes.join(' '))
        .append(label)
        .append(input),

    makeForm: (...formGroups) => {
        let form = $("<form></form>");
        formGroups.forEach(x => $(form).append(x));
        $(form).submit(false);
        return $(form);
    }
})
