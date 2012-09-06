var config = require("./../config.json");
var nano = require('nano')('http://'+config.couch.host+':'+config.couch.port);

exports.init = function()
{
	initDatabaseIfRequired(config.couch.usersDB, function()
	{
		GLOBAL.usersDB = nano.use(config.couch.usersDB);
		registerUserDesignDoc();
	});
	initDatabaseIfRequired(config.couch.matchesDB, function()
	{
		GLOBAL.matchesDB = nano.use(config.couch.matchesDB);
		registerMatchesDesignDoc();
	});
}

function initDatabaseIfRequired(databaseName, callback)
{
	db = nano.db.get(databaseName, function (err, body)
	{
	  if (err)
	  {
		  console.log("Creating database '" + databaseName + "'.");
		  nano.db.create(databaseName, function (error, body, header)
		  {
			  if(error)
			  {
				console.log("Database creation failed: "+ error);  
			  }
			  else
			  {
			  	console.log("Database '" + databaseName + "' created.");
			  	callback();
			  }
			});	
	  }
	  else
	  {
		  callback();  
	  }
	});
}

function registerUserDesignDoc()
{
	GLOBAL.usersDB.insert(
	{"views":
		{
			"by_name":{ "map": function(doc) { emit(doc.name, doc); } } 
		}
	}
	,
	"_design/users"
	,
	function(error, body, header)
	{
		if(error)
		{
    		console.log("Register user design doc FAILED:"+ error);
		}
		else
		{
    		console.log("Register user design doc.");
		}
	});
}

function registerMatchesDesignDoc()
{
	GLOBAL.matchesDB.insert(
	{"views":
		{
			"by_date":{ "map": function(doc) { emit(doc.date, doc); } } 
		}
	}
	,
	"_design/matches"
	,
	function(error, body, header)
	{
		if(error)
		{
    		console.log("Register match design doc FAILED:"+ error);
		}
		else
		{
    		console.log("Register match design doc.");
		}
	});
}