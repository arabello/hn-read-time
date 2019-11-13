$(document).ready(() => chrome.storage.sync.get(null, opts =>{
    
    let settingsForm = `
        <form>
            <
        </form>
    `;


    for (let k in opts){
        if (opts[k].is_advanced)
            continue;

        let opt = opts[k]

        $("#options").append(setting);
    }
}));
