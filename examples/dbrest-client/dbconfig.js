const config = {
  mysql : {
    "dialect": "mysql",
      "connection":{
          "connectionLimit": 10,
          "acquireTimeout": 300,
          "host" : "172.19.0.4",
          "user" : "root",
          "password" : "admin",
          "port": "3306",
          "database" : "bd_desenv"
      }      
  },
  postgres:{
    "dialect": "postgresql",
    "connection": {
      "dialect": "postgresql",
      "server": "172.9.0.2",
      "port": "5432",
      "database": "postgres",
      "user": "postgres",
      "password": "admin"
    },
    "modelsDir": "models",
    "prefix": "dbrest"
  },
  mssql: {
		"userName": "sa",
		"password": "1qaz!QAZ",
		"server": "10.85.227.44",
		"options": {
		  "database": "CQ",
		  "instanceName": "SQLEXPRESS",
		  "rowCollectionOnRequestCompletion": true
		}
	}
}

module.exports = config;