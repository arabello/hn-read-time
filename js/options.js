$(document).ready(() => chrome.storage.sync.get(null, options =>{
    for (let k in options){
        $("#options").append("<tr><td>"+k+"</td><td><input id='"+k+"' value='"+options[k]+"'></td></tr>")
    }
}));
