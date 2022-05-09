
// 1) Что вызвало сообщение?, 2) Сообщение для вывода
module.exports.statement = (target, message, module = 'unknown') => {

    target = String(target);
    message = String(message);

    console.log(`>> ${target}() message >> ${message} (module : '${module}')`);
}