const Request = require('tedious').Request;
const ISOLATION_LEVEL = require('tedious').ISOLATION_LEVEL;
const ConnectionPool = require('tedious-connection-pool');
const TYPES = require('tedious').TYPES;

/**
 * MSSQL Adapter. It implements the Database interface methods.
 * @constructor
 * @config: {json} config - database connection options. Ex:
 *    {
 *       "userName": "user",
 *       "password": "password",
 *       "server": "localhost",
 *       "options": {
 *         "database": "MyDB",
 *         "instanceName": "SQLEXPRESS",
 *         "rowCollectionOnRequestCompletion": true
 *       }
 *    }
 */
function MSSql(config) {
    this.config = config;
    this.config.isolationLevel = ISOLATION_LEVEL.READ_UNCOMMITTED;
    this.config.connectionIsolationLevel = ISOLATION_LEVEL.READ_UNCOMMITTED;

    this.poolConfig = {
        min: 4,
        max: 20,
        log: true
    };
  
    this.TYPES = TYPES;
}

/**
 * Creates a pool of database connections.
 */
MSSql.prototype.createPool = async function () {
    return new Promise((resolve, reject)=>{
        if (!this.pool){
            this.pool = new ConnectionPool(this.poolConfig, this.config);
        }

        this.pool.on('error', function(err) {
            if (err) {
                reject(err);
            }
        });

        resolve('');
    });
}

/**
 * Execute a query against the database.
 * @statement: {string} statement - Sql statement to be executed.
 * @params: query parameters
 */
MSSql.prototype.query = async function query(statement, params) {
    return new Promise((resolve, reject)=>{
        this.pool.acquire(function(err, connection){
            if (err) {
                reject(err);
            } else {      
				const request = new Request(statement, function(err, rowCount, rows) {
	                if (err) {
						connection.release();
						err.statement = statement;
						reject(err);
	                } else {
						const records = [];
						for (let i = 0; i < rows.length; i++) {
		                    const row = rows[i];
		                    const rec = {}; 
		                    for (let j = 0; j < row.length; j++) {
		                    	const col = row[j];
		                    	rec[col.metadata.colName] = col.value;
		                    };
	                    	records.push(rec); 
	                	};

	                	connection.release();
	                	resolve(records);
	                }
            	});

            	for (p in params) {
			    	request.addParameter(p, params[p].type, params[p].value);
			    }
            	
            	connection.execSql(request);
            }
        });
    });  
}

/**
 * Execute a insert statement against the database.
 * @statement: {string} statement - Sql statement to be executed.
 */
MSSql.prototype.insert = function insert(statement) {
	const sql = statement + "; select @@identity";
	return this.query(sql);
}

/**
 * Execute a update statement against the database.
 * @statement: {string} statement - Sql statement to be executed.
 */
MSSql.prototype.update = function update(statement) {
  return this.query(statement);
}

/**
 * Returns a isNull clause. 
 * @value1: nullable value
 * @value2: default value
 */
MSSql.prototype.isNull = function(value1, value2) {
  return 'ISNULL(' + value1 + ', ' + value2 + ')'; 
}

MSSql.prototype.getColumns = function(table) {
  const sql = `
    SELECT c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_DEFAULT, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,
           c.NUMERIC_PRECISION, c.NUMERIC_PRECISION_RADIX, c.NUMERIC_SCALE,
           c.DATETIME_PRECISION, case when pk.Column_Name = c.COLUMN_NAME then 1 else null end primaryKey
    FROM INFORMATION_SCHEMA.COLUMNS c
    INNER JOIN INFORMATION_SCHEMA.TABLES t on t.table_schema = c.table_schema
    LEFT JOIN (
      SELECT Col.Table_Name, Col.Column_Name
        from 
            INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
            INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col 
          where Col.Table_Name = '${table}' and Tab.TABLE_NAME = '${table}'
          and Tab.Constraint_Type = 'PRIMARY KEY'
          and Tab.CONSTRAINT_NAME = Col.CONSTRAINT_NAME
    ) pk on pk.Table_Name = '${table}'
    WHERE c.TABLE_NAME = '${table}'
  `
  
  return this.query(sql);
}

/*
  -- list tables and views
  SELECT table_name, table_type FROM INFORMATION_SCHEMA.TABLES where table_catalog = 'CQ'

  -- list columns in tables and views
  SELECT c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_DEFAULT, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,
         c.NUMERIC_PRECISION, c.NUMERIC_PRECISION_RADIX, c.NUMERIC_SCALE,
         c.DATETIME_PRECISION
  FROM INFORMATION_SCHEMA.COLUMNS c
  INNER JOIN INFORMATION_SCHEMA.TABLES t on t.table_schema = c.table_schema

  -- list primary and foreign keys in tables
  SELECT Constraint_Type, Col.Table_Name, Col.Column_Name from 
      INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
      INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col 
  WHERE 
      Col.Constraint_Name = Tab.Constraint_Name
      AND Col.Table_Name = Tab.Table_Name
      AND Constraint_Type in ( 'PRIMARY KEY', 'FOREIGN KEY' )
*/

module.exports = MSSql;
