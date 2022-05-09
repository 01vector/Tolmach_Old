import {showHideMenu} from './modules/menu.js'
import {hideItems} from './modules/wordMeanings.js'
import {fixHeader} from './modules/fixHeader.js'

window.addEventListener('DOMContentLoaded', () => {

    let dropdownButtons = Array.from(document.getElementsByClassName('dropdown-button'));

    dropdownButtons.forEach((element) => {
        element.addEventListener('click', (e)=>{
            hideItems(e.currentTarget, e.currentTarget.previousElementSibling);
        })

        hideItems(element, element.previousElementSibling);
    });

    showHideMenu();  //  show / hide sidebar
    fixHeader(20);
})
