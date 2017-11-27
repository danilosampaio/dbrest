const fs = require('fs');
const path = require('path');
const moment = require('moment');
const sqlParser = require('simple-sql-parser');
const _ = require('lodash');
const stringifyObject = require('stringify-object');
const ModelError = require('./ModelError');

/**
 * The Models class is the core of the DBrest. It reads the models in 'modelsDir', and publish a rest API for each model(CRUD).
 * @constructor
 * @database {object} database - Database classe instance.
 * @modelsDir: {string} modelsDir - The directory where the models reside. default: <__dirname>/models
 */
function Models(database, modelsDir, events) {
	this.database = database;
	this.modelsDir = modelsDir;

	this.bindEvents(events);
	global.ModelError = ModelError;
}

/**
 * The restify method creates a rest API for each model found in 'modelsDir'.
 * @router {object} router - The express Router instance.
 * @authentication: {function} authentication - the authentication function (express middleware function).
 * @onLoadModel: {function} onLoadModel - a function that is called always a model is loaded. Signature: function(file, Model){}. 
 */
Models.prototype.restify = async function (router, authentication, onLoadModel) {
	const files = fs.readdirSync(this.modelsDir, 'utf8');

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const url = path.basename(file, '.js').toLowerCase();
		const Model = require(path.join(this.modelsDir, file));

		//if (file == 'Teste.js') {
		//	try {
				const model = new Model(this.database);
				//console.log(await model.define())
				//console.log(await model.find())
		//	} catch (e) {
		//		console.log(e)
		//	}
		//}

		if (authentication) {
			router.get('/' + url, authentication, this.findResponse(model));
			router.get('/' + url + '/define', authentication, this.defineResponse(model));
			router.get('/' + url + '/fetch', authentication, this.fetchResponse(model));
			/*if (Model.canInsert === undefined || Model.canInsert){
				router.post('/insert' + url, authentication, this.insertResponse(Model));
			}
			if (Model.readOnly === undefined || !Model.readOnly){
				router.post('/update' + url, authentication, this.updateResponse(Model));
			}
			if (Model.canDelete === undefined || Model.canDelete){
				router.post('/delete' + url, authentication, this.deleteResponse(Model));
			}*/
		} /*else {
			router.get('/' + url, this.findResponse(Model));
			if (Model.canInsert === undefined || Model.canInsert){
				router.post('/insert' + url, this.insertResponse(Model));
			}
			if (Model.readOnly === undefined || !Model.readOnly){
				router.post('/update' + url, this.updateResponse(Model));
			}
			if (Model.canDelete === undefined || Model.canDelete){
				router.post('/delete' + url, this.deleteResponse(Model));
			}
		}

		if (onLoadModel) {
			onLoadModel(file, Model);		
		}*/
	}
}

Models.prototype.bindEvents = function bindEvents(events) {
	this.beforeInsert = events.beforeInsert || function(){};
	this.afterInsert  = events.afterInsert || function(){};
	this.beforeUpdate = events.beforeUpdate || function(){};
	this.afterUpdate  = events.afterUpdate || function(){};
	this.beforeDelete = events.beforeDelete || function(){};
	this.afterDelete  = events.afterDelete || function(){};
}

Models.prototype.find = async function find(Model, params, cb) {
	var self = this;
	var modelFind = Model.find !== undefined ? Model.find(params) : await this.defaultFind(Model, params);

	if (typeof modelFind == 'function' ) {
		modelFind(cb);
		return;
	}

	var columnDefinition = null;
	if (Model.columnDefinition !== undefined){
		columnDefinition = await Model.columnDefinition()
	} else {
		columnDefinition = await self.defaultColumnDefinition(Model);
	}

	var title = Model.title ? Model.title : this.defaultTitle(Model);
	var readOnly = Model.readOnly !== undefined ? Model.readOnly : false;
	var canSelect = Model.canSelect !== undefined ? Model.canSelect : true;
	var showButtons = Model.showButtons !== undefined ? Model.showButtons : true;
	var paginate = Model.paginate !== undefined ? Model.paginate : false;

	this.database.query(modelFind, function(err, records){
		if (err) {
			cb(err);
			return;
		}

		var columns = [];
		var rows = [];
		var fields = columnDefinition || records[0];
		var pk = null;
		var domainModels = [];
		var domains = {};

		for (column in fields) {
			var def = columnDefinition ? columnDefinition[column] : null;

			columns.push(self.wrapColumn(Model, column, def, fields[column]));

			if (def && def.primaryKey) {
				pk = column;
			}

			if (def && def.type == 'domain') {
				domainModels.push(def.model);
			}
		}

		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			for (column in record) {
				var def = columnDefinition ? columnDefinition[column] : null;
				var value = record[column];
				var dateType = def && def.type == 'date';
				var datetimeType = def && def.type == 'datetime';

				if (value) {
					if (dateType){
						//É necessário adicionar 3 horas na data, pois o banco de dados está com o timezone errado.
						record[column] = moment(value).add(3, 'hour').format('DD/MM/YYYY');
					} else if (datetimeType){
						//É necessário adicionar 3 horas na data, pois o banco de dados está com o timezone errado.
						record[column] = moment(value).add(3, 'hour').format('DD/MM/YYYY hh:mm');
					}
				}
			}
		}

		if (Model.afterLoad !== undefined) {
			Model.afterLoad(records, params, function(err, recs, extraData){
				if (err) {
					cb(err);
					return;
				}

				records = recs;

				self.getDomainsFromModel(domainModels, function(err, domains){
					if (err) {
						cb(err);
						return;
					} 

					cb(null, {
						columns: columns,
						teste: null,
						rows: records,
						title: title,
						primaryKey: pk,
						readOnly: readOnly,
						domains: domains,
						canSelect: canSelect,
						//showButtons: showButtons,
						searchFields: Model.searchFields ? Model.searchFields : [],
						searchPlaceHolder: Model.searchPlaceHolder ? Model.searchPlaceHolder : '',
						paginate: paginate,
						sumFields: self.sumarizeFields(Model, records),
						extraData: extraData
					});
				});
			});
		} else {
			self.getDomainsFromModel(domainModels, function(err, domains){
				if (err) {
					cb(err);
					return;
				} 

				cb(null, {
					columns: columns,
					teste: null,
					rows: records,
					title: title,
					primaryKey: pk,
					readOnly: readOnly,
					domains: domains,
					canSelect: canSelect,
					//showButtons: showButtons,
					searchFields: Model.searchFields ? Model.searchFields : [],
					searchPlaceHolder: Model.searchPlaceHolder ? Model.searchPlaceHolder : '',
					paginate: paginate,
					sumFields: self.sumarizeFields(Model, records)
				});
			});
		}		
	});
}

Models.prototype.sumarizeFields = function sumarizeFields(Model, records) {
	if (Model.sumFields !== undefined) {
		var sumFields = {};

		for (var i = 0; i < records.length; i++) {
			var record = records[i];

			for (var j = 0; j < Model.sumFields.length; j++) {
				var sumField = Model.sumFields[j];
				sumFields[sumField] = sumFields[sumField] === undefined ? record[sumField] : (sumFields[sumField] + record[sumField]); 
			}		
		}

		for (f in sumFields) {
			sumFields[f] = Number(sumFields[f] ? sumFields[f].toFixed(2) : 0);
		}
		return sumFields;
	} else {
		return null;
	}
}

Models.prototype.wrapColumn = function wrapColumn(Model, column, def, value) {
	
	var defaultWidth = this.defaultColumnWidth(def);
	var columnDef = {};

	columnDef.name = column;
	columnDef.label = def && def.label ? def.label : column;
	columnDef.type = def && def.type ? def.type : this.defaultColumnType(value);
	columnDef.readOnly = def && def.readOnly !== undefined ? (typeof def.readOnly == 'function' ? this.getFunctionBody(stringifyObject(def.readOnly)) : def.readOnly) : Model.readOnly !== undefined ? Model.readOnly : false;
	columnDef.beforeChange = def && def.beforeChange !== undefined ? this.getFunctionBody(stringifyObject(def.beforeChange)) : null;
	columnDef.afterChange = def && def.afterChange !== undefined ? this.getFunctionBody(stringifyObject(def.afterChange)) : null;
	columnDef.visible = def && def.visible !== undefined ? def.visible : true;
	columnDef.tableViewVisible = def && def.tableViewVisible !== undefined ? def.tableViewVisible : true;
	columnDef.group = def && def.group !== undefined ? def.group : null;
	columnDef.width = def && def.width !== undefined ? def.width + ' wide column' : defaultWidth;
	columnDef.css = def && def.css !== undefined ? def.css : '';
	columnDef.insertable = def && def.insertable !== undefined ? def.insertable : true;
	columnDef.formViewVisible = def && def.formViewVisible != undefined ? def.formViewVisible : true;

	if (columnDef.type == 'memo') {
		columnDef.rows = def && def.rows !== undefined ? def.rows : 1;
	}
	if (columnDef.type == 'model') {
		columnDef.api = def && def.api !== undefined ? def.api : {};
		columnDef.options = {
            loadMode: 'lazy',
            showSearchInput: false,
            showFooter: false,
            color: 'teal'
        }
		if (def && def.options !== undefined){
			_.assign(columnDef.options, def.options);
		}
	} else {
		columnDef.tableWidth = def && def.width !== undefined ? def.width + ' wide ' : '';
		columnDef.onclick = def && def.onclick !== undefined ? def.onclick : null;
	}
	if (columnDef.type == 'domain' || columnDef.type == 'model') {
		columnDef.model = def && def.model !== undefined ? this.defaultTitle(def.model) : null;
	}

	return columnDef;
}

Models.prototype.getFunctionBody = function getFunctionBody (fn) {
	return fn.slice(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
}

Models.prototype.defaultColumnWidth = function defaultColumnWidth(def) {
	if (def) {
		if (def.type == 'domain') {
			return 'four wide column';
		} else if (def.type == 'date') {
			return 'three wide column';
		} else if (def.type == 'datetime') {
			return 'four wide column';
		} else if (def.type == 'memo') {
			return 'ten wide column';
		}
	}

	return 'two wide column';
}

Models.prototype.addWhereExpress = function(model, sqlExpress, params, addWhereKeyword, wherePrefix) {
	var whereExpress = [];
	var searchExpress = [];

	for (p in params) {
		if (p == 'searchText') {
			var searchFields = model.searchFields;
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

Models.prototype.addOrderBy = function (Model, sqlExpress) {
	if (Model.orderBy && Model.orderBy.length > 0) {
		return sqlExpress + ' order by ' + Model.orderBy.join(',');
	} else {
		return sqlExpress;
	}
}

Models.prototype.getDomainsFromModel = function(domainModels, cb) {
	var self = this;
	var count = 0;
	var domains = {};

	if (!domainModels.length) {
		cb(null, domains);
	}

	domainModels.forEach(function(model, index){
		self.find(model, {}, function(err, result){
			if (err){
				cb(err);
				console.log(err)
				return;
			}

			domains[self.defaultTitle(model)] = {
				data: result.rows || result,
				displayFields: model.displayFields !== undefined ? model.displayFields : [],
				primaryKey: self.getPrimaryKey(model)
			}

			count++;

			if (count == domainModels.length) {
				cb(null, domains);
			}
		});
	});
}

Models.prototype.getPrimaryKey = function(model) {
	var columns = model.columnDefinition !== undefined ? model.columnDefinition() : null;
	if (columns) {
		for (column in columns) {
			var c = columns[column];
			if (c.primaryKey) {
				return column;
			}
		}
	}

	return 'id';
}

Models.prototype.defaultColumnType = function(value) {
	var defaultTextTypes = ['number','object','string','boolean'];

	if (defaultTextTypes.indexOf(typeof value) != -1) {
		return 'text';
	}
}

Models.prototype.insert = function insert(sql, cb) {
	if (!sql) {
		cb(new Error("Não foi encontrada uma definição de insert para o modelo."));
		return;
	}

	console.log(sql)

	this.database.insert(sql, function(err, result){
		if (err) {
			cb(err);
			return;
		}

		cb(null, {
			inserted: result[0]['']
		});
	});
}

Models.prototype.update = function update(sql, cb) {
	if (!sql) {
		cb(new Error("Não foi encontrada uma definição de update para o modelo."));
		return;
	}

	console.log(sql)

	this.database.update(sql, function(err, result){
		if (err) {
			cb(err);
			return;
		}

		cb(null, {
			updated: result
		});
	});
}

Models.prototype.insertResponse = function insertResponse(Model) {
	var self = this;

	return  function (req, res) {
		var sql = Model.insert !== undefined ? Model.insert(req.body) : self.defaultInsert(Model, req.body);
    
	    const ast = sqlParser.sql2ast(sql);
	    const audit = ast.value.into.table.toLowerCase() != 'audit';
	    let auditObj = null;

	    if (audit){
			auditObj = {
		    	table: ast.value.into.table,
		    	columns: ast.value.values.map(obj => obj.target.column),
		    	values: ast.value.values.map(obj => obj.value)
		    }
			self.beforeInsert(auditObj, req);
		}

		if (Model.beforeInsert){
	    	Model.beforeInsert(auditObj, req, function(err){
	    		if (err) {
	    			res.json({
		                err: err
		            });
	    		} else {
	    			self.insert(sql, function (err, result) {
				    	if (err) {
				            res.json({
				                err: err
				            });
				        } else {
				        	if (audit){
				        		auditObj.id = result.inserted;
								self.afterInsert(auditObj, req);
							}
				            res.json(result);
				        }
				    }); 
	    		}
	    	});		    	
	    } else {	    
		    self.insert(sql, function (err, result) {
		    	if (err) {
		            res.json({
		                err: err
		            });
		        } else {
		        	if (audit){
		        		auditObj.id = result.inserted;
						self.afterInsert(auditObj, req);
					}
		            res.json(result);
		        }
		    });
	    } 
	}
}

Models.prototype.updateResponse = function updateResponse(Model) {
	var self = this;

	return  function (req, res) {
		var sql = Model.update !== undefined ? Model.update(req.body) : self.defaultUpdate(Model, req.body);

		const ast = sqlParser.sql2ast(sql);
	    const audit = ast.value && ast.value.table ? ast.value.table.table.toLowerCase() != 'audit' : false;
	    let auditObj = null;

	    if (audit){
			auditObj = {
		    	table: ast.value.table.table,
		    	columns: ast.value.values.map(obj => obj.target.column),
		    	values: ast.value.values.map(obj => obj.value),
		    	where: ast.value.where.expression
		    }
		    self.beforeUpdate(auditObj, req);
		}

		if (Model.beforeUpdate){
	    	Model.beforeUpdate(auditObj, req, function(err){
	    		if (err) {
	    			res.json({
		                err: err
		            });
	    		} else {
	    			self.update(sql, function (err, result) {
				    	if (err) {
				            res.json({
				                err: err
				            });
				        } else {
				        	if (audit){
								self.afterUpdate(auditObj, req);
							}
				            res.json(result);
				        }
				    }); 
	    		}
	    	});		    	
	    } else {
	    	self.update(sql, function (err, result) {
		    	if (err) {
		            res.json({
		                err: err
		            });
		        } else {
		        	if (audit){
						self.afterUpdate(auditObj, req);
					}
		            res.json(result);
		        }
		    }); 
	    }
	}
}

Models.prototype.delete = function(sql, cb) {
	this.database.query(sql, function(err){
		if (err) {
			cb(err);
			return;
		}

		cb(null, {
			deleted: true
		});
	});
}

Models.prototype.deleteResponse = function deleteResponse(Model) {
	var self = this;

	return  function (req, res) {
		var sql = Model.delete !== undefined ? Model.delete(req.body) : self.defaultDelete(Model, req.body);

		const ast = sqlParser.sql2ast(sql);
	    const audit = ast.value.from[0].table.toLowerCase() != 'audit';
	    let auditObj = null;

	    if (audit){
			auditObj = {
		    	table: ast.value.from[0].table,
		    	where: ast.value.where.expression
		    }
			self.beforeDelete(auditObj, req);
		}
	    	    
	    self.delete(sql, function (err, result) {
	    	if (err) {
	            res.json({
	                err: err
	            });
	        } else {
	        	if (audit){
					self.afterDelete(auditObj, req);
				}
	            res.json(result);
	        }
	    }); 
	}
}
//



Models.prototype.findResponse = function(model) {
	return async function (req, res) {
		try {
			const params = req.query;

			await model.onBeforeFind(params);
			const result = await model.find(params);
			await model.onAfterFind(params, result);

			if (model.extraData) {
				result.extraData = model.extraData
			}

			res.json(result);
		} catch (err) {
			res.json({
                err: {
                	message: err.message,
                	stack: err.stack
                }
            });
		}
	}
}

Models.prototype.defineResponse = function(model) {
	return async function (req, res) {
		try {
			const result = await model.def();
			res.json(result);
		} catch (err) {
			res.json({
                err: {
                	message: err.message,
                	stack: err.stack
                }
            });
		}
	}
}

Models.prototype.fetchResponse = function(model) {
	return async function (req, res) {
		try {
			const params = req.query;
			const result = {};

			const definition = await model.def();
			result.definition = definition;
			//const data = await model.find(req.query);
			await model.onBeforeFind(params);
			const data = await model.find(params);
			await model.onAfterFind(params, data);
			result.data = data;

			if (model.extraData) {
				result.extraData = model.extraData
			}

			res.json(result);
		} catch (err) {
			res.json({
                err: {
                	message: err.message,
                	stack: err.stack
                }
            });
		}
	}
}

Models.prototype.selectColumns = function(columnDefinition) {
	var columns = [];

	for (c in columnDefinition) {
		if (columnDefinition[c].type != 'model'){
			columns.push(c);
		}
	}

	return columns;
}

Models.prototype.insertColumns = function(columnDefinition, params) {
	var columns = [];

	for (c in columnDefinition) {
		if (columnDefinition[c].type == 'model') continue;
		if (columnDefinition[c].insertable === undefined || columnDefinition[c].insertable){
			if (!params || params[c] !== undefined) {
				columns.push(c);
			}
		}
	}

	return columns;
}

Models.prototype.updateColumns = function(columnDefinition, params) {
	var columns = [];

	for (c in columnDefinition) {
		if (columnDefinition[c].type == 'model') continue;
		const readOnly = typeof columnDefinition[c].readOnly == 'function' ? false : columnDefinition[c].readOnly;
		if (!readOnly && (columnDefinition[c].insertable === undefined || columnDefinition[c].insertable)){
			if (!params || params[c] !== undefined) {
				columns.push(c);
			}
		}
	}

	return columns;
}

Models.prototype.insertSqlValues = function(columnDefinition, params) {
	var values = [];

	for (c in columnDefinition) {
		if (columnDefinition[c].type == 'model') continue;
		if (columnDefinition[c].insertable === undefined || columnDefinition[c].insertable){
			if (!params || params[c] !== undefined) {
				const value = params[c] || (columnDefinition[c].defaultValue !== undefined ? columnDefinition[c].defaultValue() : null);
				values.push(this.sqlValue(c, columnDefinition[c], value));
			}
		}
	}

	return values;
}

Models.prototype.sqlValue = function (name, def, value) {
	var type = def.type;
	var sqlValue = null;

	if (type === undefined || type == 'text' || type == 'memo') {
		sqlValue = this.toTextValue(value);
	} else if (type == 'boolean') {
		sqlValue = this.toBooleanValue(value);
	} else if (type == 'date') {
		sqlValue = this.toDateValue(value);
	} else if (type == 'datetime') {
		sqlValue = this.toDateValue(value);
	} else if (type == 'domain'){
		var cd = def.model.columnDefinition ? def.model.columnDefinition() : null;
		if (cd) {
			var pk = this.getPrimaryKey(def.model);
			sqlValue = this.sqlValue(pk, cd, value);
		} else {
			sqlValue = this.toSqlValue(value);
		}		
	} else {
		sqlValue = this.toSqlValue(value);
	}

	return sqlValue;
}

Models.prototype.updateSqlValues = function(columnDefinition, params) {
	var values = [];

	for (c in columnDefinition) {
		if (columnDefinition[c].type == 'model') continue;
		const readOnly = typeof columnDefinition[c].readOnly == 'function' ? false : columnDefinition[c].readOnly;
		if (!readOnly && (columnDefinition[c].insertable === undefined || columnDefinition[c].insertable)){
			if (!params || params[c] !== undefined) {
				values.push(this.sqlValue(c, columnDefinition[c], params[c]));
			}
		}
	}

	return values;
}

Models.prototype.toDateValue = function(value) {
	if (!value) {
		return 'null';
	}

	var ar = null;
	var sqlDate = '';
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

Models.prototype.toTextValue = function(value) {
	if (value) {
		return "'" + value + "'";
	} else {
		return 'null'
	}
}

Models.prototype.toSqlValue = function(value) {
	if (value) {
		return value;
	} else {
		return 'null';
	}
}

Models.prototype.toBooleanValue = function(value) {
	return value == 'true' || value == true ? 1 : 0;
}

Models.prototype.defaultFind = async function(Model, params) {
	const table = Model.tableName ? Model.tableName : this.defaultTitle(Model);
	let columns = null;	
	if (!Model.columnDefinition) {
		const self = this;
		columns = self.selectColumns(await this.defaultColumnDefinition(Model));
	} else {
		columns = this.selectColumns(Model.columnDefinition());
	}

	let sqlExpress = this.addWhereExpress(Model, "select "+ columns +" from " + table, params, true);
	sqlExpress = this.addOrderBy(Model, sqlExpress);
	return sqlExpress;
}

Models.prototype.defaultInsert = function(Model, params) {
	if (Model.columnDefinition === undefined) {
		return null;
	}
	var table = Model.tableName ? Model.tableName : this.defaultTitle(Model);
    var columns = this.insertColumns(Model.columnDefinition(), params);
    var values = this.insertSqlValues(Model.columnDefinition(), params);
    var sql = "insert into "+ table +" ("+ columns +") " +
              "values ("+ values +")";

    return sql;
}

Models.prototype.defaultUpdate = function(Model, params) {
	if (Model.columnDefinition === undefined) {
		return null;
	}
	var table = Model.tableName ? Model.tableName : this.defaultTitle(Model);
    var columns = this.updateColumns(Model.columnDefinition(), params);
    var values = this.updateSqlValues(Model.columnDefinition(), params);
    var statement = "update "+ table + " set ";
    var assignments = [];

    for (var i = 0; i < columns.length; i++) {
    	var c = columns[i];
    	var v = values[i];
    	assignments.push(c + ' = ' + v);
    }

    var whereExpress = [];
    var columnDefinition = Model.columnDefinition();
    for (p in params) {
    	if (columnDefinition[p] && columnDefinition[p].primaryKey) {
    		var pkValue = this.sqlValue(p, columnDefinition[p], params[p])
    		whereExpress.push(' where ' + p + ' = ' + pkValue);
    	}
    }

    if (whereExpress.length) {
    	return statement + assignments.join(',') + whereExpress;
    } else {
    	return '';
    }
}

Models.prototype.defaultDelete = function(Model, params) {
    var columns = Model.columnDefinition();
    var pk = null;

    for (c in columns){
        if (columns[c].primaryKey) {
            pk = c;
            break;
        }
    }
    var table = Model.tableName ? Model.tableName : this.defaultTitle(Model);
    return "delete from "+ table +" where " + pk + " in ("+ params.pks +")";
}

module.exports = Models;
