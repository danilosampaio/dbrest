import test from 'ava';
import {DBRest} from '.';

let dbrest = null;
const template = {/* eslint-disable camelcase */
	col_bigint: 1,
	col_bit: '101',
	col_boolean: true,
	col_character: 'X',
	col_character_varying: 'Create a REST API from your database models.',
	col_date: '2018-09-07',
	col_double_precision: 1.99999,
	col_money: 1.99999,
	col_numeric: 1.99999,
	col_real: 1.99999,
	col_smallint: 12345,
	col_text: 'Simple, Cross-database, and fast.',
	col_time_with_time_zone: '00:00:00+1459',
	col_timestamp_with_time_zone: '2018-09-07 00:00:00+03'
};

test.before('Connecting to database and load models from directory', async () => {
	dbrest = new DBRest({
		dialect: 'postgresql',
		connection: {
			dialect: 'postgresql',
			server: 'localhost',
			port: '5432',
			database: 'dbrest',
			user: 'postgres',
			password: 'postgres'
		},
		modelsDir: 'examples/dbrest-client/models',
		prefix: 'dbrest'
	});

	await dbrest.init();
});

test('Insert, Find, Update, and Delete record', async t => {
	const {DBRest} = dbrest.models;
	const inserted = await DBRest.insert(template);
	let records = await DBRest.find({
		id: inserted.id
	});
	t.is(records.length, 1);
	t.is(records[0].col_character, 'X');

	records[0].col_character = 'Y';
	await DBRest.update(records[0]);

	records = await DBRest.find({
		id: inserted.id
	});
	t.is(records[0].col_character, 'Y');

	await DBRest.delete({
		id: inserted.id
	});

	const deletedRecord = await DBRest.find({
		id: inserted.id
	});
	t.is(deletedRecord.length, 0);
});

test('Insert with transaction', async t => {
	const {DBRest} = dbrest.models;

	const uuid = await dbrest.beginTransaction();
	const insertions = [];

	try {
		insertions.push(await DBRest.insert(template, uuid));
		throw new Error('Transaction control!');
	} catch (e) {
		await dbrest.rollbackTransaction(uuid);
	}

	const records = await DBRest.find({
		id: insertions.map(p => p.id)
	});
	t.is(records.length, 0);
});

test.after('Disconnecting to database', async () => {
	await dbrest.disconnect();
});
