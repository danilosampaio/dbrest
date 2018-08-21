# DBRest [![Build Status](https://travis-ci.org/danilosampaio/dbrest.svg?branch=master)](https://travis-ci.org/danilosampaio/dbrest)

> DBRest simplifies the publishing of rest API from simple SQL Models.
Supported databases: postgresql and mssql.

## In development, don't use it yet.


## Install

```
$ npm install --save dbrest
```


## Usage


> Define a model:
```js
//Considering there is a table/view in your database named 'Foo', that's all!
const Model = require('dbrest').Model;

class Foo extends Model {
    
}

module.exports = Foo;
```


> Attach the rest API to the express app:
```js
const DBRest = require('dbrest');
const dbrest = new DBRest({
    'dialect': 'mssql',
    'modelsDir': 'models'
});

await dbrest.init(router);
app.use('/', router);
```

> It's Done! DBRest will generate the CRUD REST API: /foo, /insertfoo, /updatefoo, deletefoo.
> See the result of GET method at _(server)_/foo
```js
{
   "columns": [
      {
         "name":"id",
         "label":"Id",
         "type":"text",
         "readOnly":true,
         ...
      },
      {
         ...
      }
   ],
   "rows":[
      {
         "id":666,
         "name":"John",
         ...
      },
      {
      	...
      }
   ],
   "title":"Foo",
   "primaryKey":"id",
   ...
}
```

## API

### init(router, authentication)

#### router

*Required*  
Type: `Object`

The express Router - express.Router();

#### authentication

*Optional*
Type: `function`  

Express middleware function. Signature:
```js
function(req, res, next){
	
}
```


## License

MIT © [Danilo Sampaio](http://github.org/danilosampaio)