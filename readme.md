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
function Foo() {

}
module.exports = Foo;
```


> Attach the rest API to the express app:
```js
var DBRest  = require('dbrest');
var dbrest = new DBRest();

dbrest.init(
	router /* express.Router() */, 
	null /* optional authentication function */, 
	null /* optional onLoadModel function */, 
	function(err){ /* callback */
		if (err) {
			console.log(err);
		}
	}
);
```

> It's Done! see the result at _(server)_/foo
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

### init(router, authentication, onLoadModel, cb)

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

#### onLoadModel

*Optional*
Type: `function`  

Function that is called always a model is loaded. Signature:
```js
function(file, Model){
	//file: 'foo.js'
	//Model: Foo (class)
}
```

#### cb

Type: `function`  

The callback function called when init method finish.


## License

MIT © [Danilo Sampaio](http://github.org/danilosampaio)