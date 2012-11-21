function PlayerInspectView(loadableTable)
{

var players, inspectPlayer;
var table = loadableTable;
var self = this;

this.setPlayer = function(playerName)
{
	inspectPlayer = playerName;
	players = null;
	self.loadPlayers();
}

var sortKey = "mixedStats.score";
var sortReversed;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.element.show();
	if(players == null)
	{
		self.loadPlayers();
	}
}

this.hide = function()
{
	table.element.hide();
}

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, onPlayersLoaded);
}

this.setPlayers = function(data)
{
	onPlayersLoaded(data)
}

this.updateRows = function()
{
	table.clear();
	table.setLoading(true);
}

function onPlayersLoaded(data)
{
	players = data.concat();
	updateSort();
}

function updateRows()
{
	table.setLoading(false);
	table.clear();
	
	var X, Y;
	var userRow;
	for(X in players)
	{
		if (players[X].name == inspectPlayer)
		{
			fillRowsWithVersus(players[X]);			
		}
	}
}

function fillRowsWithVersus(user)
{
	setContentsOfTag(table, "inspectedPlayer", user.name);
	
	var X, userRow;
	var versus = user.versus ? user.versus : {};
	for (X in versus)
	{
		userRow = table.createRow();
		fillRowWithUser(userRow, X, versus[X]);	
	}
}

function fillRowWithUser(tableRow, opponent, versusData)
{
	var userLink = "<a href='javascript:inspect(\""+opponent+"\")'>"+opponent+"</a>";
	
//	var image = getPlayerImageElement(user, 30);
//	$(tableRow).find("playerImage").replaceWith(image);
	setContentsOfTag(tableRow, "playerName", userLink);
	setContentsOfTag(tableRow, "wins", safeStr(versusData.wins));
	setContentsOfTag(tableRow, "losses", safeStr(versusData.losses));
}

function safeStr(obj)
{
	if(obj != undefined)
	{
		return Math.round(Number(obj));
	}
	return "";
}

function safeSlashNum(num1, num2)
{
	if(num1 == undefined) num1 = 0;
	if(num2 == undefined) num2 = 0;
	if(num1 == 0 && num2 == 0)
	{
		return "";
	}
	return num1 + " / " + num2;
}

this.addPlayer = function()
{
	if(players == null)
	{
		alert("User loading in progress.");
		return;
	}
	
	ensureAuthorisedAndCall(addPlayerAfterAuth);
}

function addPlayerAfterAuth()
{
	var username = prompt("Enter your name to add : ", "");
	if(username == null)
	{
		return;
	}
	if(findUserByName(players, username))
	{
		alert("User already exists : " +  username );
	}
	else
	{
		var yes = confirm("Do you really want to add new user '" + username+ "'?");
	   if( yes )
	   {
			callAPI({request:"addPlayer", name:username, fbAccessToken:facebookAccessToken}, onPlayerAdded);
	   }
	}
}

function onPlayerAdded(response)
{
	if(response.status == "error")
	{
		alert(response.message ? response.message : "Error adding player.")
	}
	else
	{
		self.loadPlayers();
	}
}

this.toggleSortBy = function(key)
{
	if(sortKey == key)
	{
		sortReversed = !sortReversed;
	}
	else
	{
		sortReversed = false;
		sortKey = key;
	}
	updateSort();
}

function updateSort()
{
	var properties = sortKey.split(".");
	players.sort(function(a, b)
	{
		var avalue = readPropertyChain(a, properties);
		var bvalue = readPropertyChain(b, properties);
		if(typeof avalue == "string") 
		{
			avalue = avalue.toLowerCase();
		}
		if(typeof bvalue == "string") 
		{
			bvalue = bvalue.toLowerCase();
		}
		var value = 0;
		
		if(avalue < bvalue)
		{
			value = 1;
		}
		else if(avalue > bvalue)
		{
			value = -1;
		}
		if(sortReversed)
		{
			return -value;
		}
		return value;
	});
	updateRows();
}

function readPropertyChain(obj, properties)
{
	for( var X in properties)
	{
		obj = obj[properties[X]];
		if(obj == null)
		{
			return "";
		}
	}
	return obj;
}

this.rebuiltStats = function()
{
	ensureAuthorisedAndCall(function()
	{
		table.clear();
		table.setLoading(true);
		callAPI({request:"rebuiltMatchStats"}, onRebuiltMatchStats);
	});
}

this.repeatMatches = function()
{
	ensureAuthorisedAndCall(function()
	{
		table.clear();
		table.setLoading(true);
		callAPI({request:"repeatMatchStats"}, onRebuiltMatchStats);
	});
}

function onRebuiltMatchStats(ok)
{
	self.loadPlayers();
	if(!ok)
	{
		alert("Failed");
	}
}
}
