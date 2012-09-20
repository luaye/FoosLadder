var OFFLINE = false;
var FACEBOOK_APP_ID = '362209653861831';

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

function getChildByTag(container, name)
{
	return container.getElementsByTagName(name)[0];
}

function setContentsOfTag(container, name, content)
{
	var tag = getChildByTag(container, name);
	if(tag)
	{
		if(content instanceof Element)
		{
			tag.appendChild(content);
		}
		else
		{
			tag.innerHTML = content;
		}
	}
}

