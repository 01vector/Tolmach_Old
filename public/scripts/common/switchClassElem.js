'use strict'

/**
 * Switch element's class. First press on the trigger - add class, second press - remove class
 * 
 * @param {object} changedElem 
 * @param {object} triggerSellector trigger for a switching
 * @param {string} elemChangedSelector switchable selector name
 * @param {string} eventType event type (f.e. 'click', 'dblclick')
 */
export const switchClassElem = (changedElem, triggerSellector, elemChangedSelector, eventType = 'click') => {
        document.querySelector(triggerSellector).addEventListener(eventType, () => {
        changedElem.classList.toggle(elemChangedSelector);
    })
}