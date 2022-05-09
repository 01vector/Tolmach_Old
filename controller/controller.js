'use strict'
/*
Общая логика работы контроллера : mainController() получает 2 значения: 1) режим, 2) данные. 
В зависимости от режима контроллер осуществляет различные действия.

Режимы раоты контроллера:

    - searchProccessing : проверка значения в БД и дальнейшие действия со словом из поиска получаемым на вход
      data - значение, отправленное с представления, из поля поиска

    - translationArrayProccessing : отправка массива строк после перевода на обработку и возврат нового объекта
      data - 

*****************

TODO:
1) isIrVerb +
2) не добавлять формы к существительным +
3) предусмотреть non-continiouous + 
4) поменять иф елсе в руле на unless
5) поменять пути (на относительные)
6) добавить все проверки по маленькому регистру
7) modal verbs
8) разобраться со сценарием поиска частей речи и других "слов-сепараторов"
9) двойной перевод слов (сущ, глагол)
10) отделить модуль взаимодействия с БД
11) отделить основные константы
12) добавить хелперы для представления
*/

const api = require('./api'),
      log = require('./log'),
      access = require('../index'),
      Word = require('../models/Words'),
      forms = require('./forms');

let viewObject = {
    english : {},
    russian : {},
},                                 //  финальный объект (для представления)
    arrayBeforeTranslation = [],  //  Массив подготовленный к отправке в API
    availability = 15;

/*
    - добавление ID при подгрузке в БД
*/

/* 
Объект хранит индексы сепараторов
очищается после создания конечного объекта для отправки в БД 
*/
const separators = {
    partOfSpeech : [],
    example : null,
    phoneticsAudio : null,
    phoneticsText : null,
};

/**
 * Преобразует объект из API в массив, отправляемый на перевод в Яндекс
 * @param {Object} targetObj Object from the API after JSON.parse();
 * @returns Array
 */
const parseForTranslate = (targetObj) => {

    let translationArray = [], // целевой массив для отправки на перевод
        definitionsArray = [], // временный массив для значений 
        examplesArray = [],
        meanings = [], // Массив значений
        obj = [],  // временный массив для примеров
        word, // Исходное слово
        example,
        phoneticArray = [],
        phoneticAudioArray = [];

    // Записываем все объекты по слову в массив obj
    console.log('TARGET OBJ: ', targetObj);
    targetObj.forEach(el => {
        obj.push(el);
    });

    // Получаем исходное слово и записываем его в целевой массив
    word = obj[0].word;
    translationArray.push(word);

    // Записываем массив полей с ключами meanings каждого объекта по слову
    obj.forEach( el => {
        (el.meanings).forEach(el => {
            meanings.push(el);
        });
    });

    // Пройтись по всем элементам (el) массива объектов (meanings)
    meanings.forEach(el => {

        // Пройтись по всем ключам объекта el
        for (const key in el) {

            // Когда встречаем часть речи
            if (key === 'partOfSpeech') {
                definitionsArray.push(el[key]);
                separators.partOfSpeech.push(definitionsArray.length);
                continue;
            }

            // Когда встречаем значения
            if (key === 'definitions') {
                
                // Пройти по всем объектам массива definitions
                let defArr = el[key];  //  массив объектов definitions
                defArr.forEach( defEl => {

                    // Пройти по свойствам текущего объекта в массиве definitions
                    for (const defKey in defEl) {
                        
                        // Если находимся в поле 'definition', добавляем значение в массив для значений
                        if (defKey === 'definition') {
                            const definition = defEl[defKey];
                            definitionsArray.push(definition);
                            continue;
                        };

                        // Если находимся в поле 'example', добавляем пример в массив для примеров
                        if (defKey === 'example') {
                            example = defEl[defKey];

                            // Каждый из временных массивов должен начинаться со своего типа 
                            // Данный массив начинается со слова example
                            if (examplesArray[0] !== 'example') {
                                examplesArray[0] = 'example';
                            };

                            examplesArray.push(example);
                            continue;
                        }
                    }
                })
            }
        }
    });

    /* Соединить массивы в один translationArray по схеме 
    ['word', 'partOfSpeech', 'def1', 'def2', ... , example, 'ex1', 'ex2', ... , ] */
    translationArray = translationArray.concat(definitionsArray).concat(examplesArray);
    separators.phoneticsText = translationArray.length;
    translationArray = translationArray.concat(phoneticArray);

    definitionsArray = [];
    examplesArray = [];
    phoneticArray = [];

    separators.example = translationArray.findIndex( (el, i) => {
        if (el === 'example') {
            return i;
        };
    });

    return translationArray;
}


/**
 * Формирует объект, готовый для отправки в представление
 * @param {Array} translateArr Массив переведенных значений
 * @param {Array} nonTranslateArr Массив исходных значений
 * @param {String} onLang На какой язык переводим? (удалить)
 * @param {Bool} flag Очищать ли сепараторы?
 * @returns {Object} Объект, готовый к отправке в представление
 */
const parseAfterTranslate = (translateArr, nonTranslateArr, onLang, flag = true) => {

    const partOfSpeechSeparators = separators.partOfSpeech,
          examplesSeparators = separators.example,
          phoneticsSeparator = separators.phonetics,
          meaningsObj = {
              word : '',
              meanings : {},
              examples : [],
              phonetics : {
                  text: {
                      us : [],
                      uk : [],
                      unknown : [],
                  },
                  audio: {
                      us : '',
                      uk : '',
                      unknown : '',
                  },
              },
          };

    let propName,
        propValue,
        partOfSpeech,
        currentPartOfSpeech,
        separatorValue = []; //  Встречали этот сепаратор уже или нет?

    // Наименование слова
    propValue = translateArr[0][0].toUpperCase() + translateArr[0].slice(1);
    meaningsObj.word = propValue;

    // Перебрать массив с переводами
    translateArr.forEach( (el, i) => {

        // Если это сепаратор части речи
        if ( partOfSpeechSeparators.includes(i)) {

            //Если этой части речи еще не было
            if ( !separatorValue.includes(translateArr[i])) {

                // Отметить, что данный сепаратор встретился
                separatorValue.push(translateArr[i]);  

                // Создаем новый объект по части речи
                partOfSpeech = nonTranslateArr[i];
                meaningsObj.meanings[partOfSpeech] = new Object();
                currentPartOfSpeech = meaningsObj.meanings[partOfSpeech];

                // Часть речи 
                propName = String('partOfSpeech');
                propValue = translateArr[i][0].toUpperCase() + translateArr[i].slice(1);
                currentPartOfSpeech[propName] = propValue;

                // Значения
                propName = String('definitions');
                currentPartOfSpeech[propName] = [];

                // Пока элемент не сепаратор -> запушить definitions
                i += 1;
                while ( !(partOfSpeechSeparators.includes(i)) && i <= translateArr.length - 1) {
                    if (i === examplesSeparators) {
                        break;
                    } else {
                        meaningsObj.meanings[partOfSpeech][propName].push(translateArr[i]);
                    }
                    i += 1;
                };
            }

            // Если эта часть речи уже была
            else if ( separatorValue.includes(translateArr[i])) {

                // Пока текущий элемент не сепаратор -> запушить значения в соответствующий объект
                let j = i;
                i += 1;
                while ( !(partOfSpeechSeparators.includes(i)) && i <= translateArr.length - 1) {
                    if (i === examplesSeparators) {
                        break;
                    } else {
                        meaningsObj.meanings[nonTranslateArr[j]][propName].push(translateArr[i])
                    }
                    i += 1;    
                }
            }
        } 

        // Если это сепаратор примеров
        else if (i === examplesSeparators) {

            // Пока не кончатся примеры
            i += 1;
            while (i <= translateArr.length - 1) {
                (meaningsObj.examples).push(translateArr[i])
                i += 1;
            };
        }; 

        // Если это сепаратор фонетики
        /* else if (phoneticsSeparator == i) {

            i += 1;
            while (i <= translateArr.length - 1) {
                (meaningsObj.phonetics).push(translateArr[i])
                i += 1;
            };
        } */
    });

    // Обнулить сепараторы
    if (flag === true) {
        separators.example = null;
        separators.partOfSpeech.splice(0, separators.partOfSpeech.length);  
        log.statement(parseAfterTranslate.name, 'ОБЪЕКТ ПОДГОТОВЛЕН К ОТПРАВКЕ В БД', 'CONTROLLER'); 
    };

    return meaningsObj;
};

// Режимы (mode == *):
// - searchProccessing - проверка значения в БД и дальнейшие действия со словом из поиска получаемым на вход
// - translationArrayProccessing - отправка массива строк после перевода на обработку и возврат нового объекта
module.exports.mainController = async (mode, data) => {

    switch (mode) {

        // Первичная обработка поискового запроса
        case 'searchProccessing':
            /* 
            Проверить корректность введенных данных (todo).
            Если данные корректны, то проверяем наличие в нашей БД.
            Если в нашей БД отсутствует тогда возвращаем url.
            Если находим в БД, вернуть объект.
            Обработка ошибок (todo)
            */
            let result;
            const checkDB = async function (searchTarget) {
                searchTarget = searchTarget[0].toUpperCase() + searchTarget.slice(1);
                availability = await Word.findOne({name: searchTarget}).lean();
                
                // Нашли в БД
                if (availability) {
                    return availability;
                } 
                
                // Не нашли в БД, обращаемся к API
                else {
                    const url = api.getURL_Dictionary(data);
                    console.log(url);
                    return url;
                }
            };

            log.statement(this.mainController.name, 'ГЛАВНЫЙ КОНТРОЛЛЕР ОТРАБОТАЛ', 'CONTROLLER');

            // result - ссылка или объект 
            return result = await checkDB(data);
        
        // Получение объекта представления после перевода
        case 'afterTranslate':
            viewObject = parseAfterTranslate(data);
            break;

        default:
            throw Error('Unknown value mainController() mode. Please, enter the correct value.');
    }

};

// На вход получает сырой объект из API (из роутов)
// 

/**
 * Возвращает полностью готовый к представлению объект (промис) после записи в базу данных 
 * @param {Object} obj Сырой объект из API (из роутов)
 */
module.exports.getSearchedObject = (obj) => {

    let viewPromise;  // Промис для представления

    // Получить массив, готовый к отправке в API Яндекса
    arrayBeforeTranslation = Array.from(parseForTranslate(obj));  

    // Отправить в API Яндекса / получить массив с переводами
    viewPromise = api.translate(arrayBeforeTranslation, 'ru', 
                  'b1gomoe83o3gmrn8veua', 
                  access.token
                )
                .then(arr => {
                    let ruObj = parseAfterTranslate(arr, arrayBeforeTranslation, 'ru', false),
                        enObj = parseAfterTranslate(arrayBeforeTranslation, arrayBeforeTranslation, 'en');

                        viewObject.english = Object.assign(viewObject.english, enObj);
                        viewObject.russian = Object.assign(viewObject.russian, ruObj);

                    // Вспомогательные
                    let usText = viewObject.english.phonetics.text.us,
                        ukText = viewObject.english.phonetics.text.uk,
                        usAudio = viewObject.english.phonetics.audio.us,
                        ukAudio = viewObject.english.phonetics.audio.uk,
                        unknownText = viewObject.english.phonetics.text.unknown;

                    // Заполнить фонетики
                    obj.forEach( el => {
                        (el.phonetics).forEach( el => {

                            // Если знаем акцент
                            if (el.audio != '') {
                                
                                if ( (el.audio).includes('-us')) {

                                    if ( !usText.includes(el.text)) {
                                        usText.push(el.text);
                                    };

                                    if (usAudio == '') {
                                        viewObject.english.phonetics.audio.us = el.audio;
                                    };
                                } else if ( (el.audio).includes('-uk')) {
                                    if ( !ukText.includes(el.text)) {
                                        ukText.push(el.text);
                                    };

                                    if (ukAudio == '') {
                                        viewObject.english.phonetics.audio.uk = el.audio;
                                    };
                                };
                            }
                            
                            // Если не знаем акцент
                            else if (el.audio == '') {

                                if (!unknownText.includes(el.text)) {
                                    unknownText.push(el.text);
                                }
                            };
                        });
                    });

                    let DB_word = {
                            en : viewObject.english.word,
                            ru : viewObject.russian.word,
                        },
                        DB_meanings = {
                            en : viewObject.english.meanings,
                            ru : viewObject.russian.meanings,
                        },
                        DB_examples = {
                            en : viewObject.english.examples,
                            ru : viewObject.russian.examples,
                        },
                        DB_phonetics_text = {
                            us : viewObject.english.phonetics.text.us,
                            uk : viewObject.english.phonetics.text.uk,
                            unknown : viewObject.english.phonetics.text.unknown,
                        },
                        DB_phonetics_audio = {
                            us : viewObject.english.phonetics.audio.us,
                            uk : viewObject.english.phonetics.audio.uk,
                            unknown : viewObject.english.phonetics.audio.unknown,
                        },
                        DB_forms = null,
                        DB_second = null,
                        DB_third = null,
                        DB_ing = null,
                        DB_thirdPerson = null,
                        DB_isChecked = null,
                        DB_isIrVerb;

                        // Если слово может быть глаголом добавить формы
                    if (viewObject.english.meanings.hasOwnProperty('verb')) {
                        DB_forms = forms.getForms(DB_word.en);

                        DB_second = DB_forms.second;
                        DB_third = DB_forms.third;
                        DB_ing = DB_forms.ing;
                        DB_thirdPerson = DB_forms.thirdPerson;
                        DB_isChecked = false;
                        DB_isIrVerb = DB_forms.isIrVerb;

                        viewObject.english.forms = DB_forms;
                        viewObject.isChecked = DB_isChecked;
                        viewObject.isIrVerb = DB_isIrVerb;
                    }
                        
                    // Создать экземпляр объекта для БД
                    let word = new Word({
                        name : DB_word.en,
                        english : {
                            word : DB_word.en,
                            meanings : DB_meanings.en,
                            examples : DB_examples.en,
                            phonetics : {
                                text : {
                                    us : DB_phonetics_text.us,
                                    uk : DB_phonetics_text.uk,
                                    unknown : DB_phonetics_text.unknown,
                                },
                                audio: {
                                    us : DB_phonetics_audio.us,
                                    uk : DB_phonetics_audio.uk,
                                    unknown : DB_phonetics_audio.unknown,
                                },
                            },
                            forms : {
                                second : DB_second,
                                third : DB_third,
                                ing : DB_ing,
                                thirdPerson : DB_thirdPerson,
                            },
                        },
                        russian : {
                            word : DB_word.ru,
                            meanings : DB_meanings.ru,
                            examples : DB_examples.ru,
                            phonetics : {
                                text : {
                                    us : DB_phonetics_text.us,
                                    uk : DB_phonetics_text.uk,
                                    unknown : DB_phonetics_text.unknown,
                                },
                                audio: {
                                    us : DB_phonetics_audio.us,
                                    uk : DB_phonetics_audio.uk,
                                    unknown : DB_phonetics_audio.unknown,
                                },
                            },
                        },
                        isChecked : DB_isChecked,
                        isIrVerb : DB_isIrVerb,
                    });

                    // Сохранить в БД
                    word.save( (err) => {
                        if (err) return err;

                        console.log('Obj saved');
                    })
  
                    return viewObject;
                });
                
    return viewPromise;
}

