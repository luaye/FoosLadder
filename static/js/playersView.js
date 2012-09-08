
function PlayersView(loadableTable)
{

var users;
var table = loadableTable;
var self = this;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.table.style.display = 'inherit';
	if(users == null)
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
	users = data;
	
	table.setLoading(false);
	table.clear();
	
	var X;
	var userRow;
	for(X in data)
	{
		userRow = table.createRow();
		fillRowWithUser(userRow, data[X]);
	}
}

function fillRowWithUser(tableRow, user)
{
	var soloStats = user.soloStats ? user.soloStats : {};
	var duoStats = user.duoStats ? user.duoStats : {};
	
	setContentsOfTag(tableRow, "playerName", user.name);
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
	if(users == null)
	{
		alert("User loading in progress.");
		return;
	}
	var username = prompt("Enter your name to add : ", "your name here");
	if(username == null)
	{
		return;
	}
	if(findUserByName(users, username))
	{
		alert("User already exists : " +  username );
	}
	else
	{
		var yes = confirm("Do you really want to add new user '" + username+ "'?");
	   if( yes )
	   {
			callAPI({request:"addPlayer", name:username}, onUsersAdded);
	   }
	}
}

function onUsersAdded(data)
{
	self.updateRows();
}

this.rebuiltStats = function()
{
	callAPI({request:"rebuiltMatchStats"}, onRebuiltMatchStats);
}

function onRebuiltMatchStats(ok)
{
	self.updateRows();
	alert(ok ? "Successful" : "Failed");
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
