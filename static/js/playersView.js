function PlayersView(loadableTable)
{

var players;
var table = loadableTable;
var self = this;

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
	
	var image = "";
	if(user.facebookId)
	{
		image = "<img src='http://graph.facebook.com/"+user.facebookId+"/picture?type=square' width='25' height='25'/>";
	}
	setContentsOfTag(tableRow, "playerImage", image);
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
	if(FACEBOOK_ENABLED && facebookAccessToken == null)
	{
		FB.login();
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
	table.clear();
	table.setLoading(true);
	callAPI({request:"rebuiltMatchStats"}, onRebuiltMatchStats);
}

this.repeatMatches = function()
{
	table.clear();
	table.setLoading(true);
	callAPI({request:"repeatMatchStats"}, onRebuiltMatchStats);
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
