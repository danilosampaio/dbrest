const path = require('path');
const Database = require('./lib/database');
const Model = require('./lib/Model')
const Restify = require('./lib/restify');

/**
 * The main classe of dbrest module.
 * @constructor
 * @param {json} params - database connection options, dialect, and models directory.
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
	this.modelsDir = params && params.modelsDir ? path.join(process.cwd(), params.modelsDir) : path.join(process.cwd(), 'models');
	this.database = new Database(this.dialect, this.options);
	this.restify = new Restify(this.database, this.modelsDir);
}

/**
 * Model import helper.
 * Ex: const Model = require('dbrest').Model
 */
DBRest.Model = Model;

/**
 * The init method creates a database connection, instatiate the models located at 'modelsDir',
 * and creates a rest API for each model.
 * @router {object} router - The express Router instance.
 * @authentication: {function} authentication - the authentication function (express middleware function).
 */
DBRest.prototype.init = async function (router, authentication) {
	await this.database.createPool();
	this.restify.publish(router, authentication);
};

module.exports = DBRest;
