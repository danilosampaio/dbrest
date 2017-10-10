const fs = require('fs');
const path = require('path');

/**
 * The Database class creates a database connection based on 'dialect' informed in params.
 * @constructor
 * @dialect {string} dialect - The params used to instatiate database connection, create express routes, etc.
 * @config: {json} config - database connection options. Ex:
 *		{
 *			"user": "postgres",
 *			"password": "postgres",
 *			"server": "localhost",
 *			"port": "5432",
 *			"database": "MyDB",
 *			"max": 10,
 *			"idleTimeoutMillis": 30000
 *		}
 */
function Database(dialect, config){  
	this.config = config || JSON.parse(fs.readFileSync(path.join(__dirname, '../../../dbrest.json'), 'utf8'));
	dialect = dialect || 'postgresql';

	const Adapter = require('./adapters/' + dialect);
	this.adapter = new Adapter(this.config[dialect]);
	this.TYPES = this.adapter.TYPES;
}

/**
 * Creates a pool of connection with the database.
 * @cb: {function} cb - The callback function called when the pool is created.
 */
Database.prototype.createPool = function createPool(cb){
  this.adapter.createPool(cb); 
}

/**
 * Execute a query in database.
 * @statemente: {string} statement - Sql statement to be executed.
 * @cb: {function} cb - The callback function called when the pool is created.
 */
Database.prototype.query = function query(statement, cb) {
  this.adapter.query(statement, cb);
}

Database.prototype.queryWithParams = function queryWithParams(statement, params, cb) {
	this.adapter.queryWithParams(statement, params, cb);
}

Database.prototype.insert = function insert(statement, cb) {
  this.adapter.insert(statement, cb);
}

Database.prototype.update = function update(statement, cb) {
  this.adapter.update(statement, cb);
}

Database.prototype.isNull = function(value1, value2) {
  return this.adapter.isNull(value1, value2);
}

module.exports = Database;
