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
		this.config = params || JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dbrest.json'), 'utf8')) || {};
		this.models = {};
		this.dialect = this.config.dialect ? this.config.dialect : 'postgresql';
		this.connectionParams = this.config.connection ? this.config.connection : null;
		this.modelsDir = this.config.modelsDir ? path.join(process.cwd(), this.config.modelsDir) : path.join(process.cwd(), 'models');
		this.prefix = this.config.api_prefix ? this.config.api_prefix : null;
	}

	/**
	 * Connect to database and create a connections pool
	 */
	async connect () {
		this.database = new Database(this.dialect, this.connectionParams);
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
		if (!this.restify) {
			this.restify = new Restify(this.prefix);
		}

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
