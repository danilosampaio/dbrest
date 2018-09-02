import {DBRest} from 'dbrest';

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const server = new http.Server(app);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

(async () => {
	try {
		const dbrest = new DBRest();
		const router = await dbrest.init();
		app.use('/', router);

		server.listen(8081, () => {
			console.log('listening on *:' + 8081);
		});
	} catch (e) {
		console.log(e);
	}
})();
