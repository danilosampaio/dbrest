const _  = require('lodash');

class Model {
	constructor (database) {
		this.database = database;

		this.title = this.defaultTitle();
		this.autoPublish = true;
		this.searchFields = this.defaultSearchFields();
	}

	//API methods (CRUD)
	async find (params = {}) {
		const table = this.tableName || this.title;
		const columns = this.selectColumns(await this.define());
		let sqlExpress = this.addWhereExpress(`select ${columns} from ${table} `, params, true);
		sqlExpress = this.addOrderBy(sqlExpress);
		return await this.database.query(sqlExpress);
	}

	async insert (params) {

	}

	async update (params) {

	}

	async delete (params) {

	}

	async def () {
		const columns = [];
		const definition = await this.define();
		for ( let column in definition ) {
			const def = definition[column];
			columns.push(this.wrapColumnDef(def, column));
		}

		return {columns};
	}
	//

	//events
	async onBeforeFind (params) {}
	async onAfterFind (params, records) {}
	async onBeforeInsert (params) {}
	async onAfterInsert (params, result) {}
	async onBeforeUpdate (params) {}
	async onAfterUpdate (params, result) {}
	async onBeforeDelete (params) {}
	async onAfterDelete (params, result) {}
	//

	async define (params) {
		if (!this.definition) {
			this.definition = await this.defineFromDB();
		}

		return this.definition;
	}

	async extend (extension) {
		const def = await this.defineFromDB();
		return _.assign(def, extension);
	}

	async defineFromDB () {
		const tableName = this.tableName || this.title;
		const cols = await this.database.getColumns(tableName);
		return this.wrapColumns(cols);
	}

	defaultTitle () {
		return this.constructor.name;
	}

	toCamelCase (str) {
	    return str
	        .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
	        .replace(/\s/g, '')
	        .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
	}

	getColumnType (dataType) {
		if (dataType === 'varchar' || dataType === 'nvarchar') {
			return 'text';
		} else if (dataType === 'bit') {
			return 'boolean';
		} else {
			return dataType;
		}
	}

	wrapColumnDef (column) {
		return {
			type: this.getColumnType(column.DATA_TYPE),
			precision: column.NUMERIC_SCALE,
			length: column.CHARACTER_MAXIMUM_LENGTH,
			primaryKey: column.primaryKey == 1 ? true : false
		}
	}

	wrapColumns (cols) {
		const columns = {};
		for (let i = 0; i < cols.length; i++) {
			const column = cols[i];
			columns[this.toCamelCase(column.COLUMN_NAME)] = this.wrapColumnDef(column);
		}
		return columns;
	}

	async defaultSearchFields () {
		const columns = await this.define();
		return Object.keys(columns);
	}

	addWhereExpress (sqlExpress, params, addWhereKeyword, wherePrefix) {
		const whereExpress = [];
		const searchExpress = [];

		for (let p in params) {
			if (p == 'searchText') {
				var searchFields = this.searchFields;
				if (searchFields) {
					for (var i = 0; i < searchFields.length; i++) {
						var field = searchFields[i];
						searchExpress.push(field + " like '%" + params[p] + "%'")
					}
				}			
			} else {
				var prop = p.indexOf('__') != -1 ? p.replace('__','.') : p;
				if (wherePrefix) {
					prop = wherePrefix + prop;
				}

				if (params[p] !== undefined){
					if (params[p].constructor === Array){
						whereExpress.push(prop + " in ('" + params[p].join("','") + "')");
					} else {
						whereExpress.push(prop + " = '" + params[p] + "'")
					}
				}
			}
		}

		if (!whereExpress.length && !searchExpress.length) {
			return sqlExpress;
		}

		if (addWhereKeyword) {
			if (searchExpress.length){
				var andConnector = whereExpress.length || !addWhereKeyword ? ' and ' : '';
				return sqlExpress + ' where ' + whereExpress.join(' and ') + andConnector + ' (' + searchExpress.join(' or ') + ') ';
			} else {
				return sqlExpress + ' where ' + whereExpress.join(' and ');
			}
		} else {
			if (searchExpress.length){
				var andConnector = whereExpress.length || !addWhereKeyword ? ' and ' : '';
				return sqlExpress + whereExpress.join(' and ') + andConnector + ' (' + searchExpress.join(' or ') + ') ';
			} else {
				if (whereExpress.length > 0) {
					return sqlExpress + ' and ' + whereExpress.join(' and ');
				} else {
					return sqlExpress;
				}			
			}
		}
	}

	addOrderBy (sqlExpress) {
		if (this.orderBy && this.orderBy.length > 0) {
			const columns = this.orderBy.join(',');
			return `${sqlExpress} order by ${columns}`;
		} else {
			return sqlExpress;
		}
	}

	selectColumns (definition) {
		//TODO: c.type != 'model'
		return Object.keys(_.pickBy(definition, c => c.type != 'model'));
	}

	apply (def, props) {
		for (let c in def) {
			_.assign(def[c], props);
		}
	}

	async getPrimaryKey () {
		const columns = await this.define();
		for (let col in columns) {
			if (columns[col].primaryKey) {
				return col;
			}
		}
		return 'id';
	}
}

module.exports = Model;