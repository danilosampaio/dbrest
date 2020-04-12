const mysql = require('mysql');

class MysqlAdapter {

  constructor(config) {
    this.config = config;
  }
  
   async createPool() {     
		this.pool = mysql.createPool(this.config);			
	}
	
	/*
		Execute a query against the database.
	*/
	async query(statement, params){
		return new Promise((res, rej) => {
			this.pool.getConnection((err, conn) => {
				if(err) rej(err);
				conn.query(statement, params, (err, result) => {
					if(err) {
						conn.release();
						rej(err)
					}else {
						conn.release();
						res(result);
					}
				})
			})
		})
	}

	/*
		Execute a insert statement against the database.
	*/
	insert(statement) {
		const sql = statement;
		return this.query(sql);
	}

	/*
		Execute a update statement against the database.
	*/
	update(statement) {
		return this.query(statement);
	}

	getTableName(table){
		const sql = `
			select distinct TABLE_NAME from INFORMATION_SCHEMA.TABLES where LOWER(TABLE_NAME) = LOWER('${table}')
		`;
		return this.query(sql);
	}
  
  getColumns(table) {		
		const sql = `
		  SELECT distinct c.TABLE_NAME as "TABLENAME", c.COLUMN_NAME as "COLUMN_NAME", 
				   c.COLUMN_DEFAULT as "COLUMN_DEFAULT", c.DATA_TYPE as "DATA_TYPE", 
				   c.CHARACTER_MAXIMUM_LENGTH as "CHARACTER_MAXIMUM_LENGTH",
				   c.NUMERIC_PRECISION as "NUMERIC_PRECISION",  
				   c.NUMERIC_SCALE as "NUMERIC_SCALE", c.DATETIME_PRECISION as "DATETIME_PRECISION", 
					 case when pk.Column_Name = c.COLUMN_NAME then 1 else null end "primaryKey",
					 case when c.EXTRA = "auto_increment" then 0 else 1 end as insertable				 
		  FROM INFORMATION_SCHEMA.COLUMNS c
		  INNER JOIN INFORMATION_SCHEMA.TABLES t on t.table_schema = c.table_schema
		  LEFT JOIN (
			SELECT Col.Table_Name, Col.Column_Name
			  from 
				  INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
				  INFORMATION_SCHEMA.KEY_COLUMN_USAGE Col 
					where LOWER(Col.Table_Name) = LOWER('${table}') and LOWER(Tab.TABLE_NAME) = LOWER('${table}')
					and Tab.Constraint_Type in ('PRIMARY KEY', 'PK_%')
					and Tab.CONSTRAINT_NAME = Col.CONSTRAINT_NAME
					) pk on LOWER(pk.Table_Name) = LOWER('${table}')
					WHERE LOWER(c.TABLE_NAME) = LOWER('${table}')
		`;
		return this.query(sql);
	}

}

module.exports = MysqlAdapter;
