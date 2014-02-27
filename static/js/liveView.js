function LiveView(view)
{
	var self = this;
	var playersById;
	
this.show = function()
{
	view.show();
	callAPI({request:"matchStatus"}, onMatchStatusLoaded);
}

this.hide = function()
{
	view.hide();
}

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
}


function onMatchStatusLoaded(matchData)
{
	console.log(matchData);
	if(matchData)
	{
		view.find(".lastUpdateTime").text("Updated bla bla bla ago");
		view.find(".leftScore").text(matchData.leftScore.toString());
		view.find(".rightScore").text(matchData.rightScore.toString());
		view.find(".leftAttacker").text(getPlayerNameOfIndex(matchData.leftPlayers, 0));
		view.find(".leftDefender").text(getPlayerNameOfIndex(matchData.leftPlayers, 1));
		view.find(".rightAttacker").text(getPlayerNameOfIndex(matchData.rightPlayers, 0));
		view.find(".rightDefender").text(getPlayerNameOfIndex(matchData.rightPlayers, 1));
		
		view.find(".leftExpectedScore").text(matchData.leftExpectedScore);
		view.find(".rightExpectedScore").text(matchData.rightExpectedScore);
		
		view.find(".leftRatingChange").text(matchData.leftRatingChange);
		view.find(".rightRatingChange").text(matchData.rightRatingChange);
	}
	else
	{
		view.hide();
	}
}

function getPlayerNameOfIndex(players, index)
{
	if(players != null && players.length > index)
	{
		var player = playersById[players[index]];
		return player ? player.name : "";
	}
	return "";
	
}

}