import test from 'ava';
import {DBRest} from '.';

let dbrest = null;

test.before('Connecting to database and load models from directory', async () => {
	dbrest = new DBRest({
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

	await dbrest.init();
});

test('Insert, Find, Update, and Delete Project', async t => {
	const {Project} = dbrest.models;
	const inserted = await Project.insert({
		name: 'DBRest',
		description: 'Create a REST API from your dataabse models.'
	});
	let projects = await Project.find({
		id: inserted.id
	});
	t.is(projects.length, 1);
	t.is(projects[0].name, 'DBRest');

	projects[0].name = 'DBRest 0__0';
	await Project.update(projects[0]);

	projects = await Project.find({
		id: inserted.id
	});
	t.is(projects[0].name, 'DBRest 0__0');

	await Project.delete({
		id: inserted.id
	});

	const deletedProject = await Project.find({
		id: inserted.id
	});
	t.is(deletedProject.length, 0);
});

test('Insert with transaction', async t => {
	const {Project} = dbrest.models;

	const uuid = await dbrest.beginTransaction();
	const insertions = [];

	try {
		insertions.push(
			await Project.insert({
				name: 'DBRest 1',
				description: 'Create a REST API from your dataabse models.'
			}, uuid)
		);

		insertions.push(
			await Project.insert({
				name: 'DBRest 2',
				description: 'Create a REST API from your dataabse models.'
			}, uuid)
		);

		insertions.push(
			await Project.insert({
				name: 'DBRest 3',
				description: 'Create a REST API from your dataabse models.'
			}, uuid)
		);

		throw new Error('Transaction control!');
	} catch (e) {
		await dbrest.rollbackTransaction(uuid);
	}

	const projects = await Project.find({
		id: insertions.map(p => p.id)
	});
	t.is(projects.length, 0);
});

test.after('Disconnecting to database', async () => {
	await dbrest.disconnect();
});
