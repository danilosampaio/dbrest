const path = require('path');
const express = require('express');
const app = express();
const router = express.Router();
const DBRest = require('dbrest');
const http = require('http').Server(app);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const dbrest = new DBRest({
    'dialect': 'mssql'
});

(async () => {
    try {
        await dbrest.init(router);
        app.use('/', router);

        http.listen(8081, function(){
          console.log('listening on *:' + 8081);
        });
    } catch (e) {
        console.log(e);
    }
})();
