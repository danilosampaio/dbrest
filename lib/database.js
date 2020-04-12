/*
	Creates a connection to database server, and exposes common methods that are implemented by Adapters (Postresql, MSSQL).
*/
class Database {
	constructor(dialect, config) {
		const dbDialect = dialect || 'postgresql';

		const Adapter = require('./adapters/' + dbDialect);
		this.adapter = new Adapter(config);
		this.TYPES = this.adapter.TYPES;
		this.dialect = dialect;
	}

	/*
		Creates a pool of connections.
	*/
	createPool() {
		return this.adapter.createPool();
	}

	/*
		Execute a query against the database.
	*/
	query(statement, params) {
		return this.adapter.query(statement, params);
	}

	/*
		Execute a insert statement against the database.
	*/
	insert(statement) {
		return this.adapter.insert(statement);
	}

	/*
		Execute a update statement against the database.
	*/
	update(statement) {
		return this.adapter.update(statement);
	}

	/*
		Returns a coalesce/isNull clause.
	*/
	isNull(value1, value2) {
		return this.adapter.isNull(value1, value2);
	}

	/*
		Returns a date-formatted value.
	*/
	toDateValue(value) {
		return this.adapter.toDateValue(value);
	}

	/*
		Return the list of columns from a table.
	*/
	getColumns(table) {
		return this.adapter.getColumns(table);
	}

	/*
		Close database connection.
	*/
	disconnect() {
		this.adapter.disconnect();
	}

	getTableName(table){
		return this.adapter.getTableName(table);		
	}
}

module.exports = Database;
