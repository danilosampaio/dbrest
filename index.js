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
		this.prefix = params && params.api_prefix ? params.api_prefix : null;
		this.restify = new Restify(this.database, this.modelsDir, this.prefix);
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
	async loadFrom (modelsDir) {
		const files = fs.readdirSync(modelsDir, 'utf8');

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const Model = require(path.join(modelsDir, file));
			this.loadModel(Model);
		}
	}

	loadModel (Model) {
		const model = new Model(this.database);
		const name = model.constructor.name;
		this.models[name] = model;
	}

	/**
	 * Publish REST API for each Model.
	 * @param {Function} middleware 
	 */
	publish (middleware) {
		return this.restify.publish(this.models, middleware);
	}

	/**
	 * The init method creates a database connection, instatiate the models located at 'modelsDir',
	 * and creates a rest API for each model.
	 * @middleware: {function} middleware - the middleware function (express middleware function).
	 */
	async init (middleware) {
		await this.connect();
		await this.loadFrom(this.modelsDir);
		return await this.publish(middleware);
	}
}

/**
 * Model import helper.
 * Ex: const Model = require('dbrest').Model
 */
DBRest.Model = Model;

module.exports = DBRest;
