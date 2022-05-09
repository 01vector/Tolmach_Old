'use strict'

export function hideItems(trigger, parentBlock) {

    function showHideItems() {
        const nativeParent = parentBlock.parentElement;
        const parentClasses = parentBlock.classList;
        const childrenElements = Array.from(parentBlock.children);
        const documentHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        let renderCoef;

        switch (nativeParent.classList[0]) {
            case 'word-meaning-area':
                renderCoef = 0.4;
                break;
        
            case 'collocation-area':
                renderCoef = 0.5;
                break;
        }

        if (parentBlock.offsetHeight < (renderCoef * documentHeight) && !parentClasses.contains('close-state')) {
            trigger.removeEventListener('click', hideItems);
            trigger.remove();
            return;
        }

        if (parentClasses.contains('close-state')) {
            childrenElements.forEach(element => {
                if (element.classList.contains('word-meaning-area__item_close')) {
                    element.classList.remove('word-meaning-area__item_close');
                }
            })

            parentClasses.toggle('close-state');
            trigger.textContent = 'Свернуть';
        } else {
            let i = childrenElements.length - 1;
            while ( parentBlock.offsetHeight > (renderCoef * documentHeight)) {
                childrenElements[i].classList.add('word-meaning-area__item_close');
                i--;
            }

            parentClasses.toggle('close-state');
            trigger.textContent = 'Ещё Z вариантов';
        }
    }

    showHideItems();
}
