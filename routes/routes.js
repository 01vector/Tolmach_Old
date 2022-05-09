const { Router } = require('express');
const router = Router();
const https = require('https');
const bodyParser = require('body-parser');
const controller = require('../controller/controller');

const urlencodedParser = bodyParser.urlencoded({ extends : false });

// Сценарий получения главной контентной страницы
router.get('/', (req, res) => {

    res.render('index', {
        title : 'Tolmach',
        isIndex : true,
    });
})

// Сценарий поиска
router.post('/', urlencodedParser, async (req, res) => {

    let viewPromise,
        url,
        finallyObj;
    
    // отправляем в контроллер и получаем url API
    const viewObject = await controller.mainController('searchProccessing', req.body.searchTarget);

    if (typeof viewObject === 'string') {
        url = viewObject;
        https.get(url, (resp) => {
            let body = '';
    
            resp.on('data', (elem) => body += elem);
    
            resp.on('end', () => {
                finallyObj = JSON.parse(body);
                viewPromise = controller.getSearchedObject(finallyObj);
    
                viewPromise.then( viewObject => {
    
                    //console.log(viewObject.english.phonetics);
    
                    let check = viewObject.english.meanings.hasOwnProperty('verb');

                    console.log('VIEW OBJ EN', viewObject);
                    console.log('VIEW OBJ RU', viewObject.english);
                    
                    if (check) {
    
                        res.render('index', {
                            title : 'Tolmach',
                            isIndex : true,
                    
                            viewObject,
                            verbForm : true,
                        });
                    } else {
                        res.render('index', {
                            title : 'Tolmach',
                            isIndex : true,
                    
                            viewObject,
                            verbForm : false,
                        });
                    };
                });
            }); 
        });
    } else if (typeof viewObject === 'object') {
        console.log('viewObj is obj', viewObject.english.phonetics);

        let examplesRu = viewObject.russian.examples.slice()
        let check = viewObject.english.meanings.hasOwnProperty('verb');
        if (check) {

            res.render('index', {
                title : 'Tolmach',
                isIndex : true,
        
                examplesRu,
                viewObject,
                verbForm : true,
            });
        } else {
            res.render('index', {
                title : 'Tolmach',
                isIndex : true,
        
                examplesRu,
                viewObject,
                verbForm : false,
            });
        };
    }
});

// Сценарий получения страницы "Мой словарь"
router.get('/list', (req, res) => {
    res.render('list', {
        title : 'Tolmach list',
        isList : true,
    });
})

// Сценарий получения профиля
router.get('/profile', (req, res) => {
    res.render('profile', {
        title : 'Profile',
        isProfile : true,
    })
})

// Сценарий получения страницы регистрации
/* router.get('/registration', (req, res) => {
    res.render('registration', {
        title : 'Registration',
        isRegistration : true,
    })
}) 

router.post('/registration', urlencodedParser, (req, res) => {
    console.log('INNER POST');
    console.log(req.body.name); 
}) */

module.exports = router;