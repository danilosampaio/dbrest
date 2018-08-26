const express = require('express');
const app = express();
const DBRest = require('dbrest');
const http = require('http').Server(app);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

(async () => {
    try {
        const dbrest = new DBRest();
        const router = await dbrest.init();
        app.use('/', router);

        http.listen(8081, function(){
          console.log('listening on *:' + 8081);
        });
    } catch (e) {
        console.log(e);
    }
})();
