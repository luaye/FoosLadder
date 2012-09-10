
function PlayersView(loadableTable)
{

var players;
var table = loadableTable;
var self = this;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.table.style.display = 'inherit';
	if(players == null)
	{
		self.loadPlayers();
	}
}

this.hide = function()
{
	table.table.style.display  = 'none';
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
	players = data;
	updateRows();
}

function updateRows()
{
	table.setLoading(false);
	table.clear();
	
	var X;
	var userRow;
	for(X in players)
	{
		userRow = table.createRow();
		fillRowWithUser(userRow, players[X]);
	}
}

function fillRowWithUser(tableRow, user)
{
	var soloStats = user.soloStats ? user.soloStats : {};
	var duoStats = user.duoStats ? user.duoStats : {};
	var mixedStats = user.mixedStats ? user.mixedStats : {};
	
	setContentsOfTag(tableRow, "playerName", user.name);
	setContentsOfTag(tableRow, "mixedScore", safeStr(mixedStats.score));
	setContentsOfTag(tableRow, "duoScore", safeStr(duoStats.score));
	setContentsOfTag(tableRow, "duoWins", safeSlashNum(duoStats.wins, duoStats.games));
	setContentsOfTag(tableRow, "soloScore", safeStr(soloStats.score));
	setContentsOfTag(tableRow, "soloWins", safeSlashNum(soloStats.wins, soloStats.games));
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
	var username = prompt("Enter your name to add : ", "your name here");
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
			callAPI({request:"addPlayer", name:username}, onPlayerAdded);
	   }
	}
}

function onPlayerAdded(data)
{
	self.loadPlayers();
}


var forwardSortKey;
this.toggleSortBy = function(key)
{
	var reversed;
	if(forwardSortKey == key)
	{
		reversed = true;
		forwardSortKey = null;
	}
	else
	{
		forwardSortKey = key;
	}
	var properties = key.split(".");
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
		if(reversed)
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
	table.clear();
	table.setLoading(true);
	callAPI({request:"rebuiltMatchStats"}, onRebuiltMatchStats);
}

function onRebuiltMatchStats(ok)
{
	self.loadPlayers();
	if(!ok)
	{
		alert("Failed");
	}
}

this.exportData = function()
{
	var exportArea = document.getElementById("exportArea");
	if(exportArea == null)
	{
		alert("can't find exportArea in view");
		return;
	}
	exportArea.innerHTML = "";
	callAPI({request:"getPlayersByIds"}, 
	function(data)
	{
		var docs = [];
		for (var X in data)
		{
			docs.push(data[X]);
		}
		var obj = {docs:docs};
		exportArea.appendChild(document.createTextNode(JSON.stringify(obj)));
	});
}

}
