var config = require("./../config.json");
var nano = require('nano')('http://'+config.couch.host+':'+config.couch.port);
var dbsReady = 0;
var queuedCallbacks = [];

exports.init = function(callback)
{
	if (callback)
		exports.afterReady(callback);
		
	initDatabaseIfRequired(config.couch.usersDB, function()
	{
		GLOBAL.usersDB = nano.use(config.couch.usersDB);
		registerUserDesignDoc();
	});
	initDatabaseIfRequired(config.couch.matchesDB, function()
	{
		GLOBAL.matchesDB = nano.use(config.couch.matchesDB);
		registerMatchesDesignDoc(GLOBAL.matchesDB);
	});
	initDatabaseIfRequired(config.couch.matchesDBClone, function()
	{
		GLOBAL.matchesDBClone = nano.use(config.couch.matchesDBClone);
		registerMatchesDesignDoc(GLOBAL.matchesDBClone);
	});
}

exports.ready = function()
{
	return dbsReady == 2;
}

exports.afterReady = function(callback)
{
	if (exports.ready())
		callback();
	else
		queuedCallbacks.push(callback);
}

function runCallbacksIfReady()
{
	console.log("running callbacks");
	var callback;
	while (callback = queuedCallbacks.pop())
		callback();
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
			,
			"by_id":{ "map": function(doc) { emit(doc._id, doc); } } 
		}
	}
	,
	"_design/users"
	,
	function(error, body, header)
	{
		if(error)
		{
    		//console.log("Register user design doc FAILED:"+ error);
		}
		else
		{
    		console.log("Register user design doc.");
		}
		dbsReady++;
		runCallbacksIfReady();
	});
}

function registerMatchesDesignDoc(db)
{
	db.insert(
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
    		//console.log("Register match design doc FAILED:"+ error);
		}
		else
		{
    		console.log("Register match design doc.");
		}
		dbsReady++;
		runCallbacksIfReady();
	});
}