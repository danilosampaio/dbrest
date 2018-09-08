/*
	Creates a connection to database server, and exposes common methods that are implemented by Adapters (Postresql, MSSQL).
*/
class Database {
	constructor(dialect, config) {
		const dbDialect = dialect || 'postgresql';

		const Adapter = require('./adapters/' + dbDialect);
		this.adapter = new Adapter(config);
		this.TYPES = this.adapter.TYPES;
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
	query(statement, params, transactionId) {
		return this.adapter.query(statement, params, transactionId);
	}

	/*
		Execute a insert statement against the database.
	*/
	insert(statement, transactionId) {
		return this.adapter.insert(statement, transactionId);
	}

	/*
		Execute a update statement against the database.
	*/
	update(statement, transactionId) {
		return this.adapter.update(statement, transactionId);
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

	/*
		Begin database transaction.
	*/
	async beginTransaction() {
		return this.adapter.beginTransaction();
	}

	/*
		Commit database transaction.
	*/
	async commitTransaction() {
		this.adapter.commitTransaction();
	}

	/*
		Rollback database transaction.
	*/
	async rollbackTransaction() {
		this.adapter.rollbackTransaction();
	}
}

module.exports = Database;
