
var FACEBOOK_APP_URL = 'http:'+FACEBOOK_APP_URL_PART;



var facebookAccessToken;
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
	var string = "<span class=\"fb-comments-count\" style=\"color:#569; font-size:12px;\" data-href=\""+makeCommentURL(key)+"\">?</span> <i class=\"icon-comment\"></i>";

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
	var activeBtnClass = "btn-info";
	var selectionBtnClass = "btn-warning";
	function makePlayerButton(player)
	{
		var btn = $("<a />");
		btn.addClass("btn");
		btn.width(136);
		btn.css('margin', 5);
		btn.addClass("btn-left");
		
		if((currentPlayer && currentPlayer == player) || (!currentPlayer && player == null))
		{
			btn.addClass(selectionBtnClass);
		}
		else if(!inactivePlayers || inactivePlayers.indexOf(player) < 0)
		{
			btn.addClass(activeBtnClass);
		}
		if(player)
		{
			var image = getPlayerImageElement(player, 25);
			if(image)
			{
				btn.append(image);
			}
			btn.append(" "+player.name);
		}
		else
		{
			btn.append("-none-");
		}
		
		btn.click(function(e)
		{
			if(btn.hasClass(activeBtnClass)) btn.removeClass(activeBtnClass);
			else btn.addClass(activeBtnClass);
            callback(dialog, player);
        });
		
		return btn;
	}
	
	var dialog = $('#playerSelectionModal');
	dialog.find("#dialogLabel").text(title);
	
	var body = dialog.find(".modal-body");
	body.empty();
	
	for( var X in players)
	{
		var player = players[X];
		
		btn = makePlayerButton(player);
		body.append(btn);
		body.append("  ");
	}
	dialog.modal().css({
		top: '60px',
		'margin-top':0
    });
	
	dialog.modal('show');
}

function hideActivePlayerSelectDialog()
{
	var dialog = $('#playerSelectionModal');
	dialog.modal('hide');
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




function LoadableTable (tableElement)
{
	this.element = $(tableElement);
	
	var rows = [];
	var loadingElement = this.element.find("#loadingRow")[0];
	var rowSample = this.element.find("#sampleRow")[0];
	
	var container = rowSample.parentNode;
	var elementAfterSampleRow = rowSample.nextSibling;
	
	container.removeChild(rowSample);

	this.table = tableElement;
	
	this.clear = function()
	{
		for(var X in rows)
		{
			var row = rows[X];
			if(row.parentNode) row.parentNode.removeChild(row);
		}
		rows = [];
	}

	
	this.setLoading = function (value)
	{
		if(loadingElement)
		{
			if(value)
			{
				loadingElement.style.display = null;
			}
			else
			{
				loadingElement.style.display = 'none';
			}
		}
	}

	this.createRow = function()
	{
		var row = rowSample.cloneNode(true);
		rows.push(row);
		if(elementAfterSampleRow)
		{
			container.insertBefore(row, elementAfterSampleRow);
		}
		else
		{
			container.appendChild(row);
		}
		return row;
	}
}



function setupDatePicker(picker)
{
	var now = new Date();
	var min = picker.find('.date-min');
	var hour = picker.find('.date-hour');
	var day = picker.find('.date-day');
	var month = picker.find('.date-month');
	var year = picker.find('.date-year');
	addDateRange(min, 0, 59, Math.floor(now.getMinutes()/10)*10, 10);
	addDateRange(hour, 0, 23, now.getHours());
	addDateRange(day, 1, 31, now.getDate());
	addDateRange(month, 1, 12, now.getMonth() + 1);
	var yearnow = now.getFullYear();
	addDateRange(year, yearnow - 1, yearnow, yearnow);
}

function addDateRange(obj, min, max, current, increment)
{
	obj.empty();
	if(!increment || increment <= 0) increment = 1;
	for(var i = min; i <= max; i += increment)
	{
		var option = $("<option></option>").attr("value",i).text(i);
		if(i == current) option.attr('selected', 'selected');
		obj.append(option);
	}
}

function getDatePickerDate(picker)
{
	var min = picker.find('.date-min').val();
	var hour = picker.find('.date-hour').val();
	var day = picker.find('.date-day').val();
	var month = Number(picker.find('.date-month').val()) - 1;
	var year = picker.find('.date-year').val();
	return new Date(year, month, day, hour, min);
}


function initAuth()
{
	if(FACEBOOK_ENABLED)
	{
		FB.Event.subscribe('auth.statusChange', function(response)
		{
			if(response.authResponse != null)
			{
				facebookAccessToken = response.authResponse.accessToken;
			}
			else
			{
				facebookAccessToken = null;
			}
			setFacebookLoginStatusDisplay(facebookAccessToken ? true : false);
		});
		setFacebookLoginStatusDisplay(false);
		FB.init({
			appId      : FACEBOOK_APP_ID,
			channelUrl : FACEBOOK_APP_URL_PART,
			status     : true,
			cookie     : true,
			xfbml      : true
		});
	}
	else
	{
		setFacebookLoginStatusDisplay(true);
	}
}

function setFacebookLoginStatusDisplay(loggedIn)
{
	var loggedIns = $(".fbLoggedIn");
	var loggedOuts = $(".fbLoggedOut");
	if(loggedIn)
	{
		loggedIns.show();
		loggedOuts.hide();
	}
	else
	{
		loggedIns.hide();
		loggedOuts.show();
	}
}

function ensureAuthorisedAndCall(callback)
{
	if(FACEBOOK_ENABLED)
	{
		FB.getLoginStatus(function(response){
		  if (response.status === 'connected')
		  {
			//var uid = response.authResponse.userID;
			facebookAccessToken = response.authResponse.accessToken;
			callback();
		  }
		  else
		  {
			FB.login(function(response) {
				if(response.authResponse != null)
				{
					facebookAccessToken = response.authResponse.accessToken;
					callback();
				}
				else
				{
					alert("Not authorised.");
				}
			});
		  }
		 });
	}
	else
	{
		callback();
	}
}