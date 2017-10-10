function ModelError(message, stack) {
	this.message = message;
	this.stack = stack || '';
}

module.exports = ModelError;