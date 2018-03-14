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
		const sqlExpress = await this.findExpress(params);
		return await this.database.query(sqlExpress);
	}

	async insert (params) {
		const sqlExpress = await this.insertExpress(params);
		return await this.database.insert(sqlExpress);
	}

	async update (params) {
		const sqlExpress = await this.updateExpress(params);
		return await this.database.query(sqlExpress);
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
		return Object.keys(_.pickBy(definition, c => c.type != 'model'));
	}

	insertColumns (definition, params) {
		return Object.keys(
			_.pickBy(definition, c => 
				c.type != 'model' &&
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);
	}

	updateColumns (definition, params) {
		return Object.keys(
			_.pickBy(definition, c => 
				c.type != 'model' &&
				!(typeof c.readOnly == 'function' ? false : c.readOnly) && 
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);
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

	async findExpress (params) {
		const table = this.tableName || this.title;
		const columns = this.selectColumns(await this.define());
		const sqlExpress = this.addWhereExpress(`select ${columns} from ${table} `, params, true);
		return this.addOrderBy(sqlExpress);
	}

	async insertExpress (params) {
		const table = this.tableName || this.title;
	    const columns = this.insertColumns(await this.define(), params);
	    const values = await this.insertSqlValues(await this.define(), params);
	    const sql = `insert into ${table} (${columns}) values (${values}) `;
	    return sql;
	}

	async updateExpress (params) {
		const definition = await this.define();
		const table = this.tableName || this.title;
	    const columns = this.updateColumns(definition, params);
	    const values = await this.updateSqlValues(definition, params);
	    const assignments = [];
	    let statement = "update "+ table + " set ";	    

	    for (let i = 0; i < columns.length; i++) {
	    	const c = columns[i];
	    	const v = values[i];
	    	assignments.push(c + ' = ' + v);
	    }

	    const whereExpress = [];
	    for (let p in params) {
	    	if (definition[p] && definition[p].primaryKey) {
	    		let pkValue = await this.sqlValue(p, definition[p], params[p])
	    		whereExpress.push(' where ' + p + ' = ' + pkValue);
	    	}
	    }

	    if (whereExpress.length) {
	    	return statement + assignments.join(',') + whereExpress;
	    } else {
	    	return '';
	    }
	}

	async deleteExpress (Model, params) {
	    const columns = await this.define();
	    let pk = null;

	    for (let c in columns){
	        if (columns[c].primaryKey) {
	            pk = c;
	            break;
	        }
	    }

	    const table = this.tableName || this.title;
	    return "delete from "+ table +" where " + pk + " in ("+ params.pks +")";
	}

	async insertSqlValues (definition, params) {
		const values = [];
		const columns = Object.keys(
			_.pickBy(definition, c => 
				c.type != 'model' &&
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);

		for (let i = 0; i < columns.length; i++) {
			const c = columns[i];
			const value = params[c] || (definition[c].defaultValue !== undefined ? definition[c].defaultValue() : null);
			values.push(await this.sqlValue(c, definition[c], value));
		}

		return values;
	}

	async sqlValue (name, def, value) {
		const type = def.type;
		let sqlValue = null;

		if (type === undefined || type == 'text' || type == 'memo') {
			sqlValue = this.toTextValue(value);
		} else if (type == 'boolean') {
			sqlValue = this.toBooleanValue(value);
		} else if (type == 'date') {
			sqlValue = this.toDateValue(value);
		} else if (type == 'datetime') {
			sqlValue = this.toDateValue(value);
		} else if (type == 'domain'){
			const ModelConstructor = def.model;
			var domain = await (new ModelConstructor(this.database)).define();
			if (domain) {
				const pk = await this.getPrimaryKey();
				sqlValue = await this.sqlValue(pk, domain, value);
			}
		} else {
			sqlValue = this.toSqlValue(value);
		}

		return sqlValue;
	}

	async updateSqlValues (definition, params) {
		const values = [];
		const columns = Object.keys(
			_.pickBy(definition, c => 
				c.type != 'model' &&
				!(typeof c.readOnly == 'function' ? false : c.readOnly) && 
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);

		for (let c in columns) {
			values.push(await this.sqlValue(c, columns[c], params[c]));
		}

		return values;
	}

	toTextValue (value) {
		if (value) {
			return "'" + value + "'";
		} else {
			return 'null'
		}
	}

	toBooleanValue (value) {
		return value == 'true' || value == true ? 1 : 0;
	}

	toDateValue (value) {
		if (!value) {
			return 'null';
		}

		let ar = null;
		let sqlDate = '';
		//'1900-01-01T03:00:00.000Z
		if (value.indexOf('Z') != -1){
			ar = value.split('T')[0].split('-');
			sqlDate = ar[1] + '/' + ar[2] + '/' + ar[0];
		} else {
			ar = value.split('/');
			sqlDate = ar[1] + '/' + ar[0] + '/' + ar[2];
		}					
		
		return this.toTextValue(sqlDate);
	}
}

module.exports = Model;