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



var activePlayerSelectDialog;

function showPlayerSelectionDialog(callback, title, players, options)
{
	var inactivePlayers = options ? options.inactivePlayers : null;
	var currentPlayer = options ? options.currentPlayer : null;
	
	function makePlayerButton(player)
	{
		var btn = $("<a />");
		btn.addClass("btn");
		btn.width(120);
		btn.addClass("btn-left");
		
		if((currentPlayer && currentPlayer == player) || (!currentPlayer && player == null))
		{
			btn.addClass("btn-warning");
		}
		else if(!inactivePlayers || inactivePlayers.indexOf(player) < 0)
		{
			btn.addClass("btn-info");
		}
		if(player)
		{
			var image = getPlayerImageElement(player, 25);
			if(image)
			{
				btn.append(image);
			}
			btn.append(player.name);
		}
		else
		{
			btn.append("-none-");
		}
		
		btn.click(function(e)
		{
			dialog.modal('hide');
            callback(player);
        });
		
		return btn;
	}
	
	var dialog = $('#playerSelectionModal');
	dialog.find("#dialogLabel").text(title);
	
	var body = dialog.find(".modal-body");
	body.empty();
	
	var btn;
	body.append(makePlayerButton(null));
	body.append("  ");
	
	for( var X in players)
	{
		var player = players[X];
		
		btn = makePlayerButton(player);
		body.append(btn);
		body.append("  ");
	}
	dialog.modal().css({
        width: '640px',
		top: '80px',
      	margin: '0 0 0 -320px'
    });
	
	dialog.modal('show');
}

function hideActivePlayerSelectDialog()
{
	var dialog = $('#playerSelectionModal');
	dialog.hide();
}

function getPlayerImageElement(player, size)
{
	var image = getPlayerImageURL(player);
	if(image)
	{
		var img = $("<img />");
		img.attr("src", image);
		if(size > 0)
		{
			img.attr("width", size);
			img.attr("height", size);
		}
		return img;
	}
	return null;
}

function getPlayerImageURL(player)
{
	if(player.facebookId)
	{
		return "http://graph.facebook.com/"+player.facebookId+"/picture?type=square";
	}
	return null;
}