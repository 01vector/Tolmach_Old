const https = require('https');
const controller = require('./controller');

let DICTIONARI_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// dictionary query
module.exports.getURL_Dictionary = (word) => {
    url = DICTIONARI_API_URL + word;
    return String(url);
};

// Объект с переводами (из API) в массив переводов
const arrAfterTranslate = (data) => {
    let dataArr = [];

    console.log('DATA: ', data);
    data = JSON.parse(data);

    for (const key in data) {
        data[key].forEach(el => {
            dataArr.push(el.text);
        });
    };

    return dataArr;
};

/**
 * Yandex API module 
 * @param {Array} texts Массив строк для перевода
 * @param {String} onLang На какой язык переводим?
 * @param {String} folderId Идентификатор папки
 * @param {String} token Токен пользователя Yandex API
 * @returns {Promise} Промис с массивом переводов
 */
module.exports.translate = async (texts, onLang, folderId, token) => {

    let path = `/translate/v2/translate?sourceLanguageCode=en&targetLanguageCode=${onLang}&folderId=${folderId}&`, 
        param,
        req,
        translateQuery;

    // Создать URL для запроса
    texts.forEach(el => {
        param = 'texts=' + String(el) + '&';
        path += param;
    });

    path = encodeURI(path);

    // Объект конфигурации для запроса
    const options = {
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`,
                },
              host: 'translate.api.cloud.yandex.net',
              path: path,
              method: 'POST',
              sourceLanguageCode: "en",
            };

    translateQuery = new Promise( (resolve, reject) => {
        req = https.request(options, (res) => {
            let data = '';
            console.log(`Status code is ${res.statusCode}`);

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                data = arrAfterTranslate(data);
                resolve(data);
            });
        });

        req.on('error', (e) => {
            reject(e);
        });
    });
    await req.end();

    return translateQuery;
};