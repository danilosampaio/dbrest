class Restify {
	constructor (database, modelsDir, prefix) {
		this.database = database;
		this.modelsDir = modelsDir;
		this.prefix = prefix;
	}

	publish (models, router, authentication) {
		for (let m in models) {
			const model = models[m];
			let url = model.constructor.name;

			if (this.prefix) {
				url = '/' + this.prefix + '/' + url;
			} else {
				url = '/' + url;
			}
			
			if (authentication) {
				router.get(url, authentication, this.findResponse(model));
				router.get(url + '/define', authentication, this.defineResponse(model));
				router.get(url + '/fetch', authentication, this.fetchResponse(model));

				if (model.canInsert === undefined || model.canInsert){
					router.post(url, authentication, this.insertResponse(model));
				}
				if (model.readOnly === undefined || !model.readOnly){
					router.put(url, authentication, this.updateResponse(model));
				}
				if (model.canDelete === undefined || model.canDelete){
					router.delete(url, authentication, this.deleteResponse(model));
				}
			} else {
				router.get(url, this.findResponse(model));
				router.get(url + '/define', this.defineResponse(model));
				router.get(url + '/fetch', this.fetchResponse(model));

				if (model.canInsert === undefined || model.canInsert){
					router.post(url, this.insertResponse(model));
				}
				if (model.readOnly === undefined || !model.readOnly){
					router.put(url, this.updateResponse(model));
				}
				if (model.canDelete === undefined || model.canDelete){
					router.delete(url, this.deleteResponse(model));
				}
			}
		}
	}

	findResponse (model) {
		return async function (req, res) {
			try {
				const params = req.query;

				await model.onBeforeFind(params);
				const result = await model.find(params);
				await model.onAfterFind(params, result);

				if (model.extraData) {
					result.extraData = model.extraData
				}

				res.statusCode = result.length ? 200 : 404;
				res.json(result);
			} catch (err) {
				res.statusCode = 400;
				res.json({
	                err: {
	                	message: err.message,
	                	stack: err.stack
	                }
	            });
			}
		}
	}

	defineResponse (model) {
		return async function (req, res) {
			try {
				const result = await model.def();
				res.statusCode = result.columns && result.columns.length ? 200 : 404;
				res.json(result);
			} catch (err) {
				res.statusCode = 400;
				res.json({
	                err: {
	                	message: err.message,
	                	stack: err.stack
	                }
	            });
			}
		}
	}

	fetchResponse (model) {
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
				res.statusCode = (result.definition && result.definition.columns && result.definition.columns.length) ||
									(result.data && result.data.length) ? 200 : 404;
				res.json(result);
			} catch (err) {
				res.statusCode = 400;
				res.json({
	                err: {
	                	message: err.message,
	                	stack: err.stack
	                }
	            });
			}
		}
	}

	insertResponse (model) {
		return async function (req, res) {
			try {
				const params = req.body;

				await model.onBeforeInsert(params);
				const result = await model.insert(params);
				await model.onAfterInsert(params, result);

				res.statusCode = 201;
				res.json(result);
			} catch (err) {
				res.statusCode = 400;
				res.json({
	                err: {
	                	message: err.message,
	                	stack: err.stack
	                }
	            });
			}
		}
	}

	updateResponse (model) {
		return async function (req, res) {
			try {
				const params = req.body;

				await model.onBeforeUpdate(params);
				const result = await model.update(params);
				await model.onAfterUpdate(params, result);

				res.statusCode = 200;
				res.json(result);
			} catch (err) {
				res.statusCode = 400;
				res.json({
	                err: {
	                	message: err.message,
	                	stack: err.stack
	                }
	            });
			}
		}
	}

	deleteResponse (model) {
		return async function (req, res) {
			try {
				const params = req.body;

				await model.onBeforeDelete(params);
				const result = await model.delete(params);
				await model.onAfterDelete(params, result);

				res.statusCode = 200;
				res.json(result);
			} catch (err) {
				res.statusCode = 400;
				res.json({
	                err: {
	                	message: err.message,
	                	stack: err.stack
	                }
	            });
			}
		}
	}
}

module.exports = Restify;