const fs = require('fs');
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
class DBRest {
	constructor (params) {
		this.models = {};
		this.dialect = params && params.dialect ? params.dialect : 'postgresql';
		this.options = params && params.options ? params.options : null;
		this.modelsDir = params && params.modelsDir ? path.join(process.cwd(), params.modelsDir) : path.join(process.cwd(), 'models');
		this.restify = new Restify(this.database, this.modelsDir);
	}

	/**
	 * Connect to database and create a connections pool
	 */
	async connect () {
		this.database = new Database(this.dialect, this.options);
		await this.database.createPool();
	}

	/**
	 * Recursively loads models from 'modelsDir' directory.
	 */
	async loadModels () {
		const files = fs.readdirSync(this.modelsDir, 'utf8');

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const url = path.basename(file, '.js').toLowerCase();
			const Model = require(path.join(this.modelsDir, file));
			this.models[url] = new Model(this.database);;
		}
	}

	/**
	 * Publish REST API for each Model.
	 * @param {Router} router 
	 * @param {Function} authentication 
	 */
	publish (router, authentication) {
		this.restify.publish(this.models, router, authentication);
	}

	/**
	 * The init method creates a database connection, instatiate the models located at 'modelsDir',
	 * and creates a rest API for each model.
	 * @router {object} router - The express Router instance.
	 * @authentication: {function} authentication - the authentication function (express middleware function).
	 */
	async init (router, authentication) {
		await this.connect();
		await this.loadModels();
		await this.publish(router, authentication);
	}
}

/**
 * Model import helper.
 * Ex: const Model = require('dbrest').Model
 */
DBRest.Model = Model;

module.exports = DBRest;
