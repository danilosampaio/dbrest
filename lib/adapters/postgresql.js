const {Pool} = require('pg');

/*
	Postgresql Adapter. It implements the Database interface methods.
*/
class Postgresql {
	constructor(config) {
		this.config = config;
		this.TYPES = [
			'bigint',
			'bigserial',
			'bit',
			'bit varying',
			'boolean',
			'box',
			'bytea',
			'character',
			'character varying',
			'cidr',
			'circle',
			'date',
			'double precision',
			'inet',
			'integer',
			'interval',
			'json',
			'jsonb',
			'line',
			'lseg',
			'macaddr',
			'money',
			'numeric',
			'path',
			'pg_lsn',
			'point',
			'polygon',
			'real',
			'smallint',
			'smallserial',
			'serial',
			'text',
			'time',
			'time without time zone',
			'time with time zone',
			'timestamp',
			'timestamp without time zone',
			'timestamp with time zone',
			'tsquery',
			'tsvector',
			'txid_snapshot',
			'uuid',
			'xml'
		];
	}

	/*
		Creates a pool of connection against the Postgresql database.
	*/
	async createPool() {
		this.pool = new Pool(this.config);
	}

	/*
		Execute a query against the database.
	*/
	async query(statement, params) {
		const result = await this.pool.query(statement, params);
		return result.rows;
	}

	/*
		Execute a insert statement against the database.
	*/
	insert(statement) {
		const sql = statement + ' returning *';
		return this.query(sql);
	}

	/*
		Execute a update statement against the database.
	*/
	update(statement) {
		return this.query(statement);
	}

	/*
		Returns a coalesce clause.
	*/
	isNull(value1, value2) {
		return 'Coalesce(' + value1 + ', ' + value2 + ')';
	}

	/*
		Returns a date-formatted value.
	*/
	toDateValue(value) {
		if (!value) {
			return 'null';
		}

		return value;
	}

	getTableName(table){
		const sql = `
			select distinct TABLE_NAME from INFORMATION_SCHEMA.TABLES where LOWER(TABLE_NAME) = LOWER('${table}')
		`;
		return this.query(sql);
	}

	/*
		Return the list of columns from a table.
	*/
	getColumns(table) {
		const quotedTableName = `"${table}"`;
		const sql = `
		  SELECT distinct c.TABLE_NAME as "TABLENAME", c.COLUMN_NAME as "COLUMN_NAME", 
				   c.COLUMN_DEFAULT as "COLUMN_DEFAULT", c.DATA_TYPE as "DATA_TYPE", 
				   c.CHARACTER_MAXIMUM_LENGTH as "CHARACTER_MAXIMUM_LENGTH",
				   c.NUMERIC_PRECISION as "NUMERIC_PRECISION", c.NUMERIC_PRECISION_RADIX as "NUMERIC_PRECISION_RADIX", 
				   c.NUMERIC_SCALE as "NUMERIC_SCALE", c.DATETIME_PRECISION as "DATETIME_PRECISION", 
				   case when pk.Column_Name = c.COLUMN_NAME then 1 else null end "primaryKey",
				 case when pg_get_serial_sequence('${quotedTableName}',c.COLUMN_NAME) is null then 1 else 0 end as insertable
		  FROM INFORMATION_SCHEMA.COLUMNS c
		  INNER JOIN INFORMATION_SCHEMA.TABLES t on t.table_schema = c.table_schema
		  LEFT JOIN (
			SELECT Col.Table_Name, Col.Column_Name
			  from 
				  INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, 
				  INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col 
				where Col.Table_Name = '${table}' and Tab.TABLE_NAME = '${table}'
				and Tab.Constraint_Type in ('PRIMARY KEY', 'PK_%')
				and Tab.CONSTRAINT_NAME = Col.CONSTRAINT_NAME
		  ) pk on pk.Table_Name = '${table}'
		  WHERE c.TABLE_NAME = '${table}'
		`;

		return this.query(sql);
	}

	/*
		Close database connection.
	*/
	disconnect() {
		this.pool.end();
	}
}

module.exports = Postgresql;
