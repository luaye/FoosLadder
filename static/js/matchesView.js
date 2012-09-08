function MatchesView(loadableTable)
{
	
var table = loadableTable;
var self = this;
var playersById;
var exportText;

table.clear();
table.setLoading(true);

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, self.setPlayers);
}

this.setPlayers = function(players)
{
	playersById = {};
	for (var X in players)
	{
		var player = players[X];
		playersById[player.id] = player;
	}
 	updateRows();
}

function updateRows()
{
	table.clear();
	table.setLoading(true);
	callAPI({request:"getMatches"}, onMatchesLoaded);
}

function onMatchesLoaded(data)
{
	table.setLoading(false);
	table.clear();
	
	var playerRow;
	for(var i = data.length - 1; i >= 0; i--)
	{
		playerRow = table.createRow();
		fillRowWithMatch(playerRow, data[i]);
	}
}

function fillRowWithMatch(tableRow, match)
{
	var cells = tableRow.getElementsByTagName("td");
	var date = new Date(match.date);
	cells[1].innerHTML = makePlayersStringFromIds(match.leftPlayers);
	cells[2].innerHTML = match.leftScore + " - " + match.rightScore;
	cells[3].innerHTML = makePlayersStringFromIds(match.rightPlayers);
	cells[4].innerHTML = date.getDate() + ", "+ (date.getMonth()+1) + ", " + date.getFullYear() + "<br/>" + doubleDigit(date.getHours()) + ":" + doubleDigit(date.getMinutes());
}

function makePlayersStringFromIds(playerIds)
{
	var players = [];
	for(var X in playerIds)
	{
		var player = playersById[playerIds[X]];
		players.push(player.name);
	}
	return players.join("<br/>");
}

function doubleDigit(number)
{
	if(number < 10)
	{
		return "0"+number;
	}
	return ""+number;
}


function onRebuiltMatchStats(ok)
{
	updateRows();
	alert(ok ? "Successful" : "Failed");
}


this.exportData = function()
{
	if(exportText)
	{
		exportText.parentNode.removeChild(exportText);
	}
	callAPI({request:"getMatchesRaw"}, 
	function(docs)
	{
		var obj = {docs:docs};
		exportText = document.createTextNode(JSON.stringify(obj));
		document.body.appendChild(exportText);
	});
}

}