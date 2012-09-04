var OFFLINE = false;

function callAPI(postdata, callback)
{
	if(!postdata.request) return;
	$.post(getAPIPath(postdata.request),
		postdata,
		function(data)
		{
			callback(data);
		},
		"json");
}

function getAPIPath(apistring)
{
	if(OFFLINE)
	{
		return getServerRoot() + "offlineapi/" +apistring + ".js";	
	}
	else
	{
		return getServerRoot() + "api";	
	}
}

function getServerRoot()
{
	return location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '') +'/';
}

function findUserByName(users, name)
{
	name = name.toLowerCase();
	var user;
	for (var X in users)
	{
		user = users[X];
		if(user.name && user.name.toLowerCase() == name)
		{
			return user;
		}
	}
	return null;
}