const pg = require('pg');

/**
 * The Database adapter for Postgresql. It implements the Database interface methods.
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
 * @cb: {function} cb - The callback function called when the pool is created.
 */
Postgresql.prototype.createPool = function createPool(cb){
	this.pool.connect((err, client, done) => {
		this.client = client;
		cb(err);
	}); 
}

/**
 * Execute a query in database.
 * @statemente: {string} statement - Sql statement to be executed.
 * @cb: {function} cb - The callback function called when the pool is created.
 */
Postgresql.prototype.query = function query(statement, cb) {
  this.client.query(statement, null, function (err, result) {
    if (err) {
    	console.log(err);
    	cb(err);
    } else { 
      cb(null, result.rows);
  	}
  });
}

Postgresql.prototype.insert = function insert(statement, cb) {
  const sql = statement + " returning *";

  this.query(sql, cb);
}

Postgresql.prototype.update = function update(statement, cb) {
  this.query(statement, cb);
}

Postgresql.prototype.isNull = function(value1, value2) {
  return 'Coalesce(' + value1 + ', ' + value2 + ')'; 
}

module.exports = Postgresql;
