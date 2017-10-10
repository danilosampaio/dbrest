const Request = require('tedious').Request;
const ISOLATION_LEVEL = require('tedious').ISOLATION_LEVEL;
const ConnectionPool = require('tedious-connection-pool');
const TYPES = require('tedious').TYPES;
/**
 * The Database adapter for MSSQL. It implements the Database interface methods.
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
 * Creates a pool of connection with the MSSQL database.
 * @cb: {function} cb - The callback function called when the pool is created.
 */
MSSql.prototype.createPool = function createPool(cb){
  if (!this.pool){
    this.pool = new ConnectionPool(this.poolConfig, this.config);
  }

  this.pool.on('error', function(err) {
    console.error(err);
    cb(err);
  }); 

  cb();
}

/**
 * Execute a query in database.
 * @statemente: {string} statement - Sql statement to be executed.
 * @cb: {function} cb - The callback function called when the pool is created.
 */
MSSql.prototype.query = function query(statement, cb) {  
  this.pool.acquire(function(err, connection){
    if (err) {
      cb(err);
      return;
    }

    const records = [];
    const request = new Request(statement, function(err, rowCount, rows) {
      if (err) {
        connection.release();
        err.statement = statement;
        cb(err);        
        return;
      } else {
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
        cb(null, records);
      }
    });

    connection.execSql(request);
  });
}

MSSql.prototype.queryWithParams = function queryWithParams(statement, params, cb) {  
  this.pool.acquire(function(err, connection){
    if (err) {
      cb(err);
      return;
    }

    const records = [];
    const request = new Request(statement, function(err, rowCount, rows) {
      if (err) {
        connection.release();
        err.statement = statement;
        cb(err);        
        return;
      } else {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rec = {}; 
          for (let j = 0; j < row.length; j++) {
            var col = row[j];
            rec[col.metadata.colName] = col.value;
          };

          records.push(rec); 
        };

        connection.release();
        cb(null, records);
      }
    });

    for (p in params) {
      request.addParameter(p, params[p].type, params[p].value);
    }

    connection.execSql(request);
  });
}


MSSql.prototype.insert = function insert(statement, cb) {
  const sql = statement + "; select @@identity"

  this.query(sql, cb);
}

MSSql.prototype.update = function update(statement, cb) {
  this.query(statement, cb);
}

MSSql.prototype.isNull = function(value1, value2) {
  return 'ISNULL(' + value1 + ', ' + value2 + ')'; 
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
