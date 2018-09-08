const {Request, ISOLATION_LEVEL} = require('tedious');
const ConnectionPool = require('tedious-connection-pool');

/*
    MSSQL Adapter. It implements the Database interface methods.
*/
class MSSql {
	constructor(config) {
		this.config = config;
		this.config.isolationLevel = ISOLATION_LEVEL.READ_UNCOMMITTED;
		this.config.connectionIsolationLevel = ISOLATION_LEVEL.READ_UNCOMMITTED;

		this.poolConfig = {
			min: 4,
			max: 20,
			log: true
		};

		this.TYPES = [
			'bigint',
			'int',
			'smallint',
			'tinyint',
			'bit',
			'decimal',
			'numeric',
			'money',
			'smallmoney',
			'float',
			'real',
			'date',
			'datetime',
			'datetime2',
			'datetimeoffset',
			'smalldatetime',
			'time',
			'char',
			'varchar',
			'text',
			'nchar',
			'nvarchar',
			'ntext',
			'binary',
			'varbinary',
			'image',
			'cursor',
			'sql_variant',
			'table',
			'timestamp',
			'uniqueidentifier'
		];
	}

	/*
		Creates a pool of database connections.
	*/
	async createPool() {
		return new Promise((resolve, reject) => {
			if (!this.pool) {
				this.pool = new ConnectionPool(this.poolConfig, this.config);
			}

			this.pool.on('error', err => {
				if (err) {
					reject(err);
				}
			});

			resolve('');
		});
	}

	/*
		Execute a query against the database.
	*/
	async query(statement, params) {
		return new Promise((resolve, reject) => {
			this.pool.acquire((err, connection) => {
				if (err) {
					reject(err);
				} else {
					const request = new Request(statement, (err, rowCount, rows) => {
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
								}
								records.push(rec);
							}

							connection.release();
							resolve(records);
						}
					});

					for (const p in params) {
						if (Object.prototype.hasOwnProperty.call(params, p)) {
							request.addParameter(p, params[p].type, params[p].value);
						}
					}

					connection.execSql(request);
				}
			});
		});
	}

	/*
		Execute a insert statement against the database.
	*/
	insert(statement) {
		const sql = statement + '; select @@identity';
		return this.query(sql);
	}

	/*
		Execute a update statement against the database.
	*/
	update(statement) {
		return this.query(statement);
	}

	/*
		Returns a isNull clause.
	*/
	isNull(value1, value2) {
		return 'ISNULL(' + value1 + ', ' + value2 + ')';
	}

	toDateValue(value) {
		if (!value) {
			return 'null';
		}

		let ar = null;
		let sqlDate = '';

		if (value.indexOf('Z') === -1) {
			ar = value.split('/');
			sqlDate = ar[1] + '/' + ar[0] + '/' + ar[2];
		} else {
			ar = value.split('T')[0].split('-');
			sqlDate = ar[1] + '/' + ar[2] + '/' + ar[0];
		}

		return sqlDate;
	}

	getColumns(table) {
		const sql = `
			SELECT distinct c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_DEFAULT, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,
					c.NUMERIC_PRECISION, c.NUMERIC_PRECISION_RADIX, c.NUMERIC_SCALE,
					c.DATETIME_PRECISION, case when pk.Column_Name = c.COLUMN_NAME then 1 else null end primaryKey,
					case when columnproperty(object_id('${table}'), c.COLUMN_NAME,'IsIdentity') = 1 then 0 else 1 end as insertable
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
			WHERE c.TABLE_NAME = '${table}'`;

		return this.query(sql);
	}

	/*
		Close database connection.
	*/
	disconnect() {
		this.pool.drain();
	}
}

module.exports = MSSql;
