# [![DBRest](assets/greeting.png)](assets/greeting.png)


## Install

```
$ npm install --save dbrest
```


## Connection
> Supported databases: Postgresql and MSSQL.

```js
const DBRest = require('dbrest');
const dbrest = new DBRest({
    'dialect': 'postgresql',
    'server': 'localhost',
    'port': '5432',
    'database': 'dbrest',
    'user': 'postgres',
    'password': 'postgres'
});
await dbrest.connect();
```

## Database table example

[![Task](assets/task.png)](assets/task.png)


## Define your 
> For a basic example, just create a class that extends `Model`.

```js
const Model = require('dbrest').Model;

class Foo extends Model {}

dbrest.loadModel(Foo);
const router = dbrest.publish();

//attach dbrest routes to your express app
app.use('/', router);
```

## Result
> It creates a REST API for CRUD operations.

Verb | Operation | Route
------------ | ------------- | -------------
HTTP / GET | get tasks from database. | /task
HTTP / POST | insert a task | /task
HTTP / PUT | update a task | /task
HTTP / DELETE | delete a task | /task

> Aditional methods

Verb | Operation | Route
------------ | ------------- | -------------
HTTP / GET | get task schema | /task/define
HTTP / GET | get task schema and data | /task/fetch


## API

### connect

Connect to database and create a connections pool.


### loadModel(model)

#### model

*Required*  
Type: `Object`

Javascript class that extends Model.


### publish(middleware)

#### middleware

*Optional*
Type: `function`  

Express middleware function.


## License

MIT © [Danilo Sampaio](http://github.org/danilosampaio)
