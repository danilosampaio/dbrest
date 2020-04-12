const fs = require('fs');
const path = require('path');
const Database = require('./lib/database');
const Restify = require('./lib/restify');

/*
	The main classe of dbrest module.
*/
class DBRest {
	constructor(params) {
		this.config = params || JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dbrest.json'), 'utf8')) || {};
		this.models = {};
		this.dialect = this.config.dialect ? this.config.dialect : 'postgresql';
		this.connectionParams = this.config.connection ? this.config.connection : null;
		this.modelsDir = this.config.modelsDir ? path.join(process.cwd(), this.config.modelsDir) : path.join(process.cwd(), 'models');
		this.prefix = this.config.api_prefix ? this.config.api_prefix : null;
	}

	/*
		Connect to database and create a connections pool
	*/
	connect() {
		this.database = new Database(this.dialect, this.connectionParams);
		return this.database.createPool();
	}

	/*
		Close database connection.
	*/
	disconnect() {
		this.database.disconnect();
	}

	/*
		Recursively loads models from 'modelsDir' directory.
	*/
	async loadFrom(modelsDir) {
		const files = this.getFiles(modelsDir, [], 'js');
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const Model = require(file);
			this.loadModel(Model);
		}
	}

	/**
	 * 
	 * @param {root folder of models files} dir 
	 * @param {If there are files to be added to the list they need to be inserted in this parameter} files_ 
	 * @param {the extension of the files to be searched} fileType 
	 */
	getFiles(dir, files_, fileType){
		var regex = fileType ? new RegExp('\\' + fileType + '$') : '';
		return fs.readdirSync(dir).reduce((allFiles, file) => {
				var name = path.join(dir, file);
				if (fs.statSync(name).isDirectory()){					
					this.getFiles(name, allFiles, fileType);
				} else if (file.match(regex)){
						allFiles.push(name);
				}
				return allFiles;
		}, files_ || []);
	}

	/*
		Load a model from class.
	*/
	loadModel(Model) {
		const model = new Model(this.database);
		const {name} = model.constructor;
		this.models[name] = model;
	}

	/*
		Publish each Model on the express Router.
	*/
	publish(middleware) {
		if (!this.restify) {
			this.restify = new Restify(this.prefix);
		}

		return this.restify.publish(this.models, middleware);
	}

	/*
		The init method creates a database connection, instatiate the models located at 'modelsDir',
		and creates a rest API for each model.
	*/
	async init(middleware) {
		await this.connect();
		await this.loadFrom(this.modelsDir);
		return this.publish(middleware);
	}
}

module.exports = DBRest;
