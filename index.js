const path = require('path');
const Database = require('./lib/database');
const Models = require('./lib/models');
const Model = require('./lib/Model')

/**
 * The main classe of DBRest module.
 * @constructor
 * @param {json} params - The params used to instatiate database connection, create express routes, etc.
 * @params.dialect: {string} dialect - 'postgresql' | 'mssql'
 * @params.options: {json} options - database connection options. Ex: 
 *		{
 *			"user": "postgres",
 *			"password": "postgres",
 *			"server": "localhost",
 *			"port": "5432",
 *			"database": "MyDB",
 *			"max": 10,
 *			"idleTimeoutMillis": 30000
 *		}
 * @params.modelsDir: {string} modelsDir - The directory where the models reside. default: <__dirname>/models
 */
function DBRest(params) {
	this.dialect = params && params.dialect ? params.dialect : 'postgresql';
	this.options = params && params.options ? params.options : null;
	this.modelsDir = params && params.modelsDir ? params.modelsDir : path.join(__dirname, '../../models/');
	this.database = new Database(this.dialect, this.options);
}

DBRest.Model = Model;

/**
 * The init method creates a database connection, instatiate the models located at 'modelsDir', and creates a rest API
 * for each model.
 * @router {object} router - The express Router instance.
 * @authentication: {function} authentication - the authentication function (express middleware function).
 * @onLoadModel: {function} onLoadModel - a function that is called always a model is loaded. Signature: function(file, Model){}. 
 * @cb: {function} cb - The callback function called when init method finish.
 */
DBRest.prototype.init = function (router, authentication, onLoadModel, events, cb) {
	this.database.createPool(err => {
		if (err) {
			cb(err);
			return;
		}

		this.models = new Models(this.database, this.modelsDir, events);
		this.models.restify(router, authentication, onLoadModel);

		cb();
	});
};

module.exports = DBRest;
