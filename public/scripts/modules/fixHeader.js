export function fixHeader(fixPosition) {

    let leftContainerScroll,
        rightContainerScroll,
        headerLeft = document.querySelector('.header-left'),
        headerRight = document.querySelector('.header-right');

    // Получаем левый и правый контейнеры
    const containers = document.querySelectorAll('.content-container');

    // Функция захвата хедера
    const toCapture = (e) => {

        // Текущий элемент
        const target = e.target;

        // Прокрутка текущего элемента
        let targetScroll = target.scrollTop;
        
        // Классы таргет-элемента
        const targetClassName = e.target.className;

        // Текущий хедер
        const currentHeader = target.firstElementChild;

        // Записать значения текущей прокрутки для конкретного контейнера
        targetClassName.includes('left-container') ? 
            leftContainerScroll = target.scrollTop :
            rightContainerScroll = target.scrollTop;
        
            if (targetScroll >= fixPosition) {
                if (!currentHeader.classList.contains('fix')) currentHeader.classList.add('fix');
            } else {
                currentHeader.classList.remove('fix');
            }
            
    };

    // Вешаем на контейнеры обработчики
    containers.forEach(el => {
        el.addEventListener('scroll', (e) => toCapture(e));
    })
}