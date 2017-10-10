import test from 'ava';
import express from 'express';
import DBRest from './index';

var dbrest = null;

test.before(t => {
	dbrest = new DBRest({
		options: {
			"postgresql": {
				"user": "postgres",
				"password": "postgres",
				"server": "localhost",
				"port": "5432",
				"database": "fractal",
				"max": 10,
				"idleTimeoutMillis": 30000
			}
		},
		modelsDir: './fixtures/models/'
	});

	dbrest.init(express.Router(), null, function(err){
		if (err) {
			console.log(err);
		}
	});
});

test(t => {
	console.log('dbrest' + dbrest)
});