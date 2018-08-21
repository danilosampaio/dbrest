const pg = require('pg');

/**
 * Postgresql Adapter. It implements the Database interface methods.
 * @constructor
 * @config: {json} config - database connection options. Ex:
 *    {
 *      "user": "postgres",
 *      "password": "postgres",
 *      "server": "localhost",
 *      "port": "5432",
 *      "database": "MyDB",
 *      "max": 10,
 *      "idleTimeoutMillis": 30000
 *    }
 */
function Postgresql(config) {
	this.config = config;
	this.pool = new pg.Pool(this.config);
}

/**
 * Creates a pool of connection with the Postgresql database.
 */
Postgresql.prototype.createPool = async function () {
	return new Promise((resolve, reject)=>{
		this.pool.connect((err, client, done) => {
			this.client = client;
			if (err) {
	    		reject(err);
	    	} else {
	    		resolve('');
	    	}
		});
	});
}

/**
 * Execute a query against the database.
 * @statement: {string} statement - Sql statement to be executed.
 * @params: query parameters
 */
Postgresql.prototype.query = async function query(statement, params) {
	return new Promise((resolve, reject)=>{
		this.client.query(statement, null, function (err, result) {
    		if (err) {
      			reject(err);
    		} else {
        		resolve(result.rows);
    		}
    	});
	});
}

/**
 * Execute a insert statement against the database.
 * @statement: {string} statement - Sql statement to be executed.
 */
Postgresql.prototype.insert = function insert(statement) {
  const sql = statement + " returning *";
  return this.query(sql);
}

/**
 * Execute a update statement against the database.
 * @statement: {string} statement - Sql statement to be executed.
 */
Postgresql.prototype.update = function update(statement) {
  return this.query(statement);
}

/**
 * Returns a coalesce clause. 
 * @value1: nullable value
 * @value2: default value
 */
Postgresql.prototype.isNull = function(value1, value2) {
  return 'Coalesce(' + value1 + ', ' + value2 + ')'; 
}

module.exports = Postgresql;
