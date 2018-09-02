const _ = require('lodash');

class Model {
	constructor(database) {
		this.database = database;

		this.title = this.defaultTitle();
		this.autoPublish = true;
		this.searchFields = this.defaultSearchFields();
	}

	async find(params = {}) {
		const sqlExpress = await this.findExpress(params);
		return this.database.query(sqlExpress);
	}

	async insert(params) {
		const sqlExpress = await this.insertExpress(params);
		return this.database.insert(sqlExpress);
	}

	async update(params) {
		const sqlExpress = await this.updateExpress(params);
		return this.database.query(sqlExpress);
	}

	async delete(params) {
		const sqlExpress = await this.deleteExpress(params);
		return this.database.query(sqlExpress);
	}

	async def() {
		return this.define();
	}

	async onBeforeFind(params) {} // eslint-disable-line no-unused-vars

	async onAfterFind(params, records) {} // eslint-disable-line no-unused-vars

	async onBeforeInsert(params) {} // eslint-disable-line no-unused-vars

	async onAfterInsert(params, result) {} // eslint-disable-line no-unused-vars

	async onBeforeUpdate(params) {} // eslint-disable-line no-unused-vars

	async onAfterUpdate(params, result) {} // eslint-disable-line no-unused-vars

	async onBeforeDelete(params) {} // eslint-disable-line no-unused-vars

	async onAfterDelete(params, result) {} // eslint-disable-line no-unused-vars

	async define(params) {// eslint-disable-line no-unused-vars
		if (!this.definition) {
			this.definition = await this.defineFromDB();
		}

		return this.definition;
	}

	async extend(extension) {
		const def = await this.defineFromDB();
		return _.assign(def, extension);
	}

	async defineFromDB() {
		const tableName = this.tableName || this.title;
		const cols = await this.database.getColumns(tableName);
		return this.wrapColumns(cols);
	}

	defaultTitle() {
		return this.constructor.name;
	}

	toCamelCase(str) {
		return str
			.replace(/\s(.)/g, $1 => {
				return $1.toUpperCase();
			})
			.replace(/\s/g, '')
			.replace(/^(.)/, $1 => {
				return $1.toLowerCase();
			});
	}

	getColumnType(dataType) {
		if (dataType === 'varchar' ||
			dataType === 'nvarchar' ||
			dataType === 'character varying' ||
			dataType === 'text') {
			return 'text';
		}
		if (dataType === 'bit') {
			return 'boolean';
		}
		if (dataType === 'int' || dataType === 'integer') {
			return 'int';
		}
		if (dataType === 'timestamp with time zone') {
			return 'datetime';
		}

		return dataType;
	}

	wrapColumnDef(column) {
		return {
			type: this.getColumnType(column.DATA_TYPE),
			databaseType: column.DATA_TYPE,
			precision: column.NUMERIC_SCALE,
			length: column.CHARACTER_MAXIMUM_LENGTH,
			primaryKey: column.primaryKey === 1,
			insertable: column.insertable === 1
		};
	}

	wrapColumns(cols) {
		const columns = {};
		for (let i = 0; i < cols.length; i++) {
			const column = cols[i];
			columns[this.toCamelCase(column.COLUMN_NAME)] = this.wrapColumnDef(column);
		}
		return columns;
	}

	async defaultSearchFields() {
		const columns = await this.define();
		return Object.keys(columns);
	}

	addWhereExpress(sqlExpress, params, addWhereKeyword, wherePrefix) {
		const whereExpress = [];
		const searchExpress = [];

		for (const p in params) {
			if (p === 'searchText') {
				if (this.searchFields) {
					for (let i = 0; i < this.searchFields.length; i++) {
						const field = this.searchFields[i];
						const param = params[p];
						searchExpress.push(`${field} like '% ${param} %'`);
					}
				}
			} else {
				let prop = p.indexOf('__') === -1 ? p : p.replace('__', '.');
				if (wherePrefix) {
					prop = wherePrefix + prop;
				}

				if (params[p] !== undefined) {
					if (params[p].constructor === Array) {
						const values = params[p].join(`','`);
						whereExpress.push(`${prop} in ('${values}')`);
					} else {
						const value = params[p];
						whereExpress.push(`${prop} = '${value}'`);
					}
				}
			}
		}

		if (whereExpress.length === 0 && searchExpress.length === 0) {
			return sqlExpress;
		}

		if (addWhereKeyword || addWhereKeyword === undefined) {
			if (searchExpress.length > 0) {
				const andConnector = whereExpress.length > 0 || !addWhereKeyword ? ' and ' : '';
				return sqlExpress + ' where ' + whereExpress.join(' and ') + andConnector + ' (' + searchExpress.join(' or ') + ') ';
			}

			return sqlExpress + ' where ' + whereExpress.join(' and ');
		}

		if (searchExpress.length > 0) {
			const andConnector = whereExpress.length > 0 || !addWhereKeyword ? ' and ' : '';
			return sqlExpress + whereExpress.join(' and ') + andConnector + ' (' + searchExpress.join(' or ') + ') ';
		}

		if (whereExpress.length > 0) {
			return sqlExpress + ' and ' + whereExpress.join(' and ');
		}

		return sqlExpress;
	}

	addOrderBy(sqlExpress) {
		if (this.orderBy && this.orderBy.length > 0) {
			const columns = this.orderBy.join(',');
			return `${sqlExpress} order by ${columns}`;
		}

		return sqlExpress;
	}

	selectColumns(definition) {
		return Object.keys(_.pickBy(definition, c => c.type !== 'model'));
	}

	insertColumns(definition, params) {
		return Object.keys(
			_.pickBy(definition, c =>
				c.type !== 'model' &&
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);
	}

	updateColumns(definition, params) {
		return Object.keys(
			_.pickBy(definition, (def, columnName) => {
				return def.type !== 'model' &&
				!(typeof def.readOnly === 'function' ? false : def.readOnly) &&
				(def.insertable === undefined || def.insertable) &&
				(!params || params[columnName] !== undefined);
			})
		);
	}

	apply(def, props) {
		for (const c in def) {
			if (Object.prototype.hasOwnProperty.call(def, c)) {
				_.assign(def[c], props);
			}
		}
	}

	async getPrimaryKey() {
		const columns = await this.define();
		for (const col in columns) {
			if (columns[col].primaryKey) {
				return col;
			}
		}
		return 'id';
	}

	async findExpress(params) {
		const table = this.tableName || this.title;
		const columns = this.selectColumns(await this.define());
		const sqlExpress = this.addWhereExpress(`select ${columns} from ${table} `, params, true);
		return this.addOrderBy(sqlExpress);
	}

	async insertExpress(params) {
		const table = this.tableName || this.title;
		const columns = this.insertColumns(await this.define(), params);
		const values = await this.insertSqlValues(await this.define(), params);
		const sql = `insert into ${table} (${columns}) values (${values}) `;
		return sql;
	}

	async updateExpress(params) {
		const definition = await this.define();
		const table = this.tableName || this.title;
		const columns = this.updateColumns(definition, params);
		const values = await this.updateSqlValues(definition, params);
		const assignments = [];
		const statement = `update ${table} set `;

		for (let i = 0; i < columns.length; i++) {
			const c = columns[i];
			const v = values[i];
			assignments.push(c + ' = ' + v);
		}

		const pkNames = [];
		let pkValues = [];

		for (const p in params) {
			if (definition[p] && definition[p].primaryKey) {
				pkNames.push(p);
				pkValues.push(this.sqlValue(p, definition[p], params[p]));
			}
		}

		pkValues = await Promise.all(pkValues);

		const whereExpress = [];
		for (let i = pkNames.length - 1; i >= 0; i--) {
			const pkName = pkNames[i];
			const pkValue = pkValues[i];
			whereExpress.push(` where ${pkName} = ${pkValue}`);
		}

		if (whereExpress.length > 0) {
			return statement + assignments.join(',') + whereExpress;
		}

		return '';
	}

	async deleteExpress(params) {
		const pk = await this.getPrimaryKey();
		const table = this.tableName || this.title;
		const pkValue = params[pk];

		return `delete from ${table} where ${pk} in (${pkValue} )`;
	}

	async insertSqlValues(definition, params) {
		const columns = Object.keys(
			_.pickBy(definition, c =>
				c.type !== 'model' &&
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);

		let values = [];
		for (let i = 0; i < columns.length; i++) {
			const c = columns[i];
			const value = params[c] || (definition[c].defaultValue === undefined ? null : definition[c].defaultValue());
			values.push(this.sqlValue(c, definition[c], value));
		}

		values = await Promise.all(values);
		return values;
	}

	async updateSqlValues(definition, params) {
		const columns = Object.keys(
			_.pickBy(definition, c =>
				c.type !== 'model' &&
				!(typeof c.readOnly === 'function' ? false : c.readOnly) &&
				(c.insertable === undefined || c.insertable) &&
				(!params || c !== undefined))
		);

		let values = [];
		for (let i = 0; i < columns.length; i++) {
			const c = columns[i];
			if (params[c]) {
				values.push(this.sqlValue(c, definition[c], params[c]));
			}
		}

		values = await Promise.all(values);
		return values;
	}

	async sqlValue(name, def, value) {
		const {type} = def;
		let sqlValue = null;

		if (type === undefined || type === 'text' || type === 'memo') {
			sqlValue = this.toTextValue(value);
		} else if (type === 'boolean') {
			sqlValue = this.toBooleanValue(value);
		} else if (type === 'date') {
			sqlValue = this.toDateValue(value);
		} else if (type === 'datetime') {
			sqlValue = this.toDateValue(value);
		} else if (type === 'domain') {
			const ModelConstructor = def.model;
			const domain = await (new ModelConstructor(this.database)).define();
			if (domain) {
				const pk = await this.getPrimaryKey();
				sqlValue = await this.sqlValue(pk, domain, value);
			}
		} else {
			sqlValue = this.toSqlValue(value);
		}

		return sqlValue;
	}

	toSqlValue(value) {
		if (value) {
			return value;
		}

		return 'null';
	}

	toTextValue(value) {
		if (value) {
			return `'${value}'`;
		}

		return 'null';
	}

	toBooleanValue(value) {
		return value === 'true' || value === true ? 1 : 0;
	}

	toDateValue(value) {
		const dateValue = this.database.toDateValue(value);
		return this.toTextValue(dateValue);
	}
}

module.exports = Model;
