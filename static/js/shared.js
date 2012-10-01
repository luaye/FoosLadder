var OFFLINE = false;
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

function toggleCommentBox(key, docid)
{
	if(docid == null)
	{
		docid = "commentbox_" + key;
	}
	var element = document.getElementById(docid);
	if(element.childNodes.length > 0)
	{
		hideCommentBox(element);
	}
	else
	{
		showCommentBox(element, key);
	}
}

function showCommentBox(element, key)
{
	element.innerHTML = '<div class="fb-comments" data-href="'+makeCommentURL(key)+'" data-num-posts="4" data-width="560" mobile="false"></div>';
	FB.XFBML.parse(element)
}

function hideCommentBox(element)
{
	element.innerHTML = '';
}

function addCommentCount(key, makeLink)
{
	document.write(getCommentCountNodeString(key, makeLink));
}

function getCommentCountNodeString(key, makeLink)
{
	var string = "<fb:comments-count href=\""+makeCommentURL(key)+"\"></fb:comments-count> comments";
	if(makeLink)
	{
		string = "<a href=\"javascript:toggleCommentBox('"+key+"')\" >"+string+"</a>";
	}
	return string;
}

function makeCommentURL(key)
{
	return FACEBOOK_APP_URL+'#'+key;
}