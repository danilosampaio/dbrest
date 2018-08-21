const fs = require('fs');
const path = require('path');

/**
 * It creates a connection to the database server.
 * @constructor
 * @dialect {string} dialect - mssql | postgresql.
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
	this.config = config || JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dbrest.json'), 'utf8'));
	dialect = dialect || 'postgresql';

	const Adapter = require('./adapters/' + dialect);
	this.adapter = new Adapter(this.config[dialect]);
	this.TYPES = this.adapter.TYPES;
}

/**
 * Creates a pool of database connections.
 */
Database.prototype.createPool = function createPool(){
	return this.adapter.createPool(); 
}

/**
 * Execute a query against the database.
 * @statement: {string} statement - Sql statement to be executed.
 * @params: query parameters
 */
Database.prototype.query = function query(statement, params) {
	return this.adapter.query(statement, params);
}

/**
 * Execute a insert statement against the database.
 * @statement: {string} statement - Sql statement to be executed.
 */
Database.prototype.insert = function insert(statement) {
	return this.adapter.insert(statement);
}

/**
 * Execute a update statement against the database.
 * @statement: {string} statement - Sql statement to be executed.
 */
Database.prototype.update = function update(statement) {
	return this.adapter.update(statement);
}

/**
 * Returns a coalesce/isNull clause. 
 * @value1: nullable value
 * @value2: default value
 */
Database.prototype.isNull = function(value1, value2) {
  return this.adapter.isNull(value1, value2);
}

/**
 * Return the list of columns from a table.
 * @table: {string} table - Table name.
 */
Database.prototype.getColumns = function(table) {
	return this.adapter.getColumns(table);
}

module.exports = Database;
