const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const todoRoutes = require('./routes/routes');
const https = require('https');
const fs = require('fs');

const TOKEN_FILE_PATH = 'token.txt',
      TOKEN_DURATION = 10800000,
      TOKEN_TIMEOUT = 11000000;

let oAuth = 'AQAAAAAxBDEhAATuwQsqr4F2SUHIlWv0WnPJvgw',
    tokenTXT = fs.readFileSync(TOKEN_FILE_PATH, 'utf-8').split(' '),
    token = tokenTXT[0],
    tokenTime = tokenTXT[1],
    previousToken = 'none',
    nowTime,
    interval,
    req;

module.exports.token = token;

// Конфигурация запроса на получение токена
const tokenQueryOptions = {
    method : 'POST',
    host : 'iam.api.cloud.yandex.net',
    path : `/iam/v1/tokens?yandexPassportOauthToken=${oAuth}`,
    headers : {
        "Content-Type" : "application/json"
    },
}

const PORT = process.env.PORT || 3000;

const app = express();
const hbs = exphbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
})

app.use(express.static(`${__dirname}/public`));

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', 'views')

app.use(todoRoutes)

async function start() {
    try {
        await mongoose.connect('mongodb+srv://volvi99:BarbaraGrey672781@tolmachdictionary.dcjj6.mongodb.net/todos', {});
        app.listen(PORT, () => {
            console.log('\n\n> Server has been started <\n---');
        });
    } catch (error) {
        console.log(error);
    };
    module.exports = mongoose;

    // Получить токен
    const getToken = (filePath) => {
        token = '';
        tokenTXT = fs.readFileSync(filePath, 'utf-8');

        tokenTXT = tokenTXT.split(' ');
        token = tokenTXT[0];
        tokenTime = tokenTXT[1];

        console.log(`> Token time (moment of receipt): ${tokenTime} <\n@`);

        nowTime = new Date().getTime();
        interval = nowTime - tokenTime;
        console.log(`> Token time (at the moment): ${interval} <`);

        if (interval >= TOKEN_DURATION) {
            req = https.request(tokenQueryOptions, (res) => {
                let body = '';
                console.log(`Status code is ${res.statusCode} (token)\n`);
                previousToken = token;
    
                res.on('data', (chunk) => {
                    body += chunk;
                });
    
                res.on('end', () => {
                    body = JSON.parse(body);
                    token = body.iamToken;
    
                    tokenTime = new Date().getTime();
    
                    fs.writeFileSync(filePath, `${token} ${tokenTime}`);
    
                    console.log(`> New token recieved! <\n@\n> Previous token: ${previousToken} <`);
                });
            });
    
            req.on('error', (error) => {
                console.error(error);
            });
    
            req.end();
        }
    }    
    getToken(TOKEN_FILE_PATH);
    setInterval( getToken, TOKEN_TIMEOUT, TOKEN_FILE_PATH);

}
start();
