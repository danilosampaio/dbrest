import test from 'ava';
import {DBRest} from '.';

test('DBRest', async t => {
	const dbrest = new DBRest({
		dialect: 'postgresql',
		connection: {
			dialect: 'postgresql',
			server: 'localhost',
			port: '5432',
			database: 'postgres',
			user: 'postgres',
			password: 'postgres'
		},
		modelsDir: 'examples/dbrest-client/models',
		prefix: 'dbrest'
	});

	await dbrest.connect();
	t.is(typeof dbrest, 'object');
	await dbrest.disconnect();
});
