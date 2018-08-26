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

Postgresql.prototype.toDateValue = function(value) {
  if (!value) {
    return 'null';
  }

  return value;
}

Postgresql.prototype.getColumns = function(table) {
	const tableName = table.toLowerCase();
	const sql = `
	  SELECT distinct c.TABLE_NAME as "TABLENAME", c.COLUMN_NAME as "COLUMN_NAME", 
			   c.COLUMN_DEFAULT as "COLUMN_DEFAULT", c.DATA_TYPE as "DATA_TYPE", 
			   c.CHARACTER_MAXIMUM_LENGTH as "CHARACTER_MAXIMUM_LENGTH",
			   c.NUMERIC_PRECISION as "NUMERIC_PRECISION", c.NUMERIC_PRECISION_RADIX as "NUMERIC_PRECISION_RADIX", 
			   c.NUMERIC_SCALE as "NUMERIC_SCALE", c.DATETIME_PRECISION as "DATETIME_PRECISION", 
			   case when pk.Column_Name = c.COLUMN_NAME then 1 else null end "primaryKey",
			 case when pg_get_serial_sequence('${tableName}',c.COLUMN_NAME) is null then 1 else 0 end as insertable
	  FROM INFORMATION_SCHEMA.COLUMNS c
	  INNER JOIN INFORMATION_SCHEMA.TABLES t on t.table_schema = c.table_schema
	  LEFT JOIN (
		SELECT Col.Table_Name, Col.Column_Name
		  from 
			  INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
			  INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col 
			where Col.Table_Name = '${tableName}' and Tab.TABLE_NAME = '${tableName}'
			and Tab.Constraint_Type in ('PRIMARY KEY', 'PK_%')
			and Tab.CONSTRAINT_NAME = Col.CONSTRAINT_NAME
	  ) pk on pk.Table_Name = '${tableName}'
	  WHERE c.TABLE_NAME = '${tableName}'
	`
	
	return this.query(sql);
}

module.exports = Postgresql;
