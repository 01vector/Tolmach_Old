'use strict';

import { ELEM_SIDEBAR, ELEM_SIDEBAR_BTN } from "../constants/constants.js";

const ELEM_SIDEBAR_BTN_ID = '#showMenu'; 

export function showHideMenu() {
    // show menu 
    ELEM_SIDEBAR_BTN.addEventListener('click', () => {
        ELEM_SIDEBAR.classList.toggle('sidebar-on');
        ELEM_SIDEBAR_BTN.classList.toggle('sidebar-btn__button_scaled');
    });
}


