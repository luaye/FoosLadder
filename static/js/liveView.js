function LiveView(view)
{
	var self = this;
	var playersById;
	
	var updateInterval;
	
this.show = function()
{
	callAPI({request:"matchStatus"}, onMatchStatusLoaded);
	
	clearInterval(updateInterval);
	updateInterval = setInterval(function(){
		callAPI({request:"matchStatus"}, onMatchStatusLoaded);
	}, 5000);
}

this.hide = function()
{
	clearInterval(updateInterval);
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
	if(matchData && matchData.date)
	{
		view.show();
		var secondsSinceUpdate = Math.round((matchData.dateNow - matchData.date) / 1000);
		
		var status = "No games in progress";
		if(secondsSinceUpdate < (10 * 60))
		{
			if(matchData.leftScore < 10 || matchData.rightScore < 10)
			{
				status = "Game in progress";
			}
		}
		
		var timeSince = "?";
		if(secondsSinceUpdate > 24 * 60 * 60)
		{
			timeSince = "more than a day";
		}
		else if(secondsSinceUpdate > 60 * 60)
		{
			var hours = Math.round(secondsSinceUpdate / (60 * 60));
			timeSince = hours + " hour" + (hours > 1 ? "s":"");
		}
		else if(secondsSinceUpdate > 60)
		{
			var mins = Math.round(secondsSinceUpdate / 60);
			timeSince = mins + " minute" + (mins > 1 ? "s":"");
		}
		else
		{
			timeSince = "moments";
		}
		
		view.find(".gameStatus").text(status);
		view.find(".lastUpdateTime").text("Last update "+timeSince+" ago");
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