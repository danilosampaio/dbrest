const express = require('express');

class Restify {
	constructor(prefix) {
		this.prefix = prefix;
		this.router = new express.Router();
	}

	publish(models, middleware) {
		if (middleware) {
			this.router.use(middleware);
		}

		for (const m in models) {
			if (Object.prototype.hasOwnProperty.call(models, m)) {
				const model = models[m];
				let url = model.route || model.constructor.name;

				if (this.prefix) {
					url = '/' + this.prefix + '/' + url;
				} else {
					url = '/' + url;
				}

				this.router.get(url, this.findResponse(model));
				this.router.get(url + '/define', this.defineResponse(model));
				this.router.get(url + '/fetch', this.fetchResponse(model));

				if (model.canInsert === undefined || model.canInsert) {
					this.router.post(url, this.insertResponse(model));
				}
				if (model.readOnly === undefined || !model.readOnly) {
					this.router.put(url, this.updateResponse(model));
				}
				if (model.canDelete === undefined || model.canDelete) {
					this.router.delete(url, this.deleteResponse(model));
				}
			}
		}

		return this.router;
	}

	findResponse(model) {
		return async function (req, res) {
			try {
				const params = req.query;

				await model.onBeforeFind(params);
				const result = await model.find(params);
				await model.onAfterFind(params, result);

				res.statusCode = (Array.isArray(result) && result.length > 0) ||
					typeof result === 'object' ? 200 : 404;
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
		};
	}

	defineResponse(model) {
		return async function (req, res) {
			try {
				const result = await model.def();
				res.statusCode = result.columns && result.columns.length > 0 ? 200 : 404;
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
		};
	}

	fetchResponse(model) {
		return async function (req, res) {
			try {
				const params = req.query;
				const result = {};

				const definition = await model.def();
				result.definition = definition;
				await model.onBeforeFind(params);
				const data = await model.find(params);
				await model.onAfterFind(params, data);
				result.data = data;

				res.statusCode = (result.definition && result.definition.columns && result.definition.columns.length > 0) ||
									((Array.isArray(result.data) && result.data.length > 0) || typeof result.data === 'object') ? 200 : 404;
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
		};
	}

	insertResponse(model) {
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
		};
	}

	updateResponse(model) {
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
		};
	}

	deleteResponse(model) {
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
		};
	}
}

module.exports = Restify;
