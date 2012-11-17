var FACEBOOK_ENABLED = true;
var FACEBOOK_APP_ID = '362209653861831';
var FACEBOOK_APP_URL_PART = '//foos.apelabs.net';
var FACEBOOK_APP_URL = 'http:'+FACEBOOK_APP_URL_PART;

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
	return getServerRoot() + "api?"+(new Date().getTime());	
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

function getCommentCountNodeString(key)
{
	var string = "<span style=\"color:#569; font-size:12px; \"><span class=\"fb-comments-count\" style=\"text-decoration:none;\"data-href=\""+makeCommentURL(key)+"\">?</span> <i class=\"icon-comment\"></i></span'>";

	return string;
}

function makeCommentURL(key)
{
	return FACEBOOK_APP_URL+'#'+key;
}