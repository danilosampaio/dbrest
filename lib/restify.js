class Restify {
	constructor (database, modelsDir) {
		this.database = database;
		this.modelsDir = modelsDir;
	}

	publish (models, router, authentication) {
		for (let m in models) {
			const model = models[m];
			const url = model.constructor.name;
			
			if (authentication) {
				router.get('/' + url, authentication, this.findResponse(model));
				router.get('/' + url + '/define', authentication, this.defineResponse(model));
				router.get('/' + url + '/fetch', authentication, this.fetchResponse(model));

				if (model.canInsert === undefined || model.canInsert){
					router.post('/insert' + url, authentication, this.insertResponse(model));
				}
				if (model.readOnly === undefined || !model.readOnly){
					router.post('/update' + url, authentication, this.updateResponse(model));
				}
				if (model.canDelete === undefined || model.canDelete){
					router.post('/delete' + url, authentication, this.deleteResponse(model));
				}
			} else {
				router.get('/' + url, this.findResponse(model));
				router.get('/' + url + '/define', this.defineResponse(model));
				router.get('/' + url + '/fetch', this.fetchResponse(model));

				if (model.canInsert === undefined || model.canInsert){
					router.post('/insert' + url, this.insertResponse(model));
				}
				if (model.readOnly === undefined || !model.readOnly){
					router.post('/update' + url, this.updateResponse(model));
				}
				if (model.canDelete === undefined || model.canDelete){
					router.post('/delete' + url, this.deleteResponse(model));
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

	defineResponse (model) {
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

	insertResponse (model) {
		return async function (req, res) {
			try {
				const params = req.body;

				await model.onBeforeInsert(params);
				const result = await model.insert(params);
				await model.onAfterInsert(params, result);

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

	updateResponse (model) {
		return async function (req, res) {
			try {
				const params = req.body;

				await model.onBeforeUpdate(params);
				const result = await model.update(params);
				await model.onAfterUpdate(params, result);

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

	deleteResponse (model) {
		return async function (req, res) {
			try {
				const params = req.body;

				await model.onBeforeDelete(params);
				const result = await model.delete(params);
				await model.onAfterDelete(params, result);

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
}

module.exports = Restify;