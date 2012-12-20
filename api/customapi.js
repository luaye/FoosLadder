var matches = require("./matches.js");
var users = require("./users.js");

exports.getRecentGainers = function(body, callback)
{
	var playerLimit = !isNaN(body.limit) ? body.limit : 3;
	var matchLimit = !isNaN(body.matchLimit) ? body.matchLimit : 10;
	
	matches.getMatches({limit:matchLimit, descending:true}, function(matches)
	{
		var playersRatingsById = {};
		var match, X;
		for (X in matches)
		{
			match = matches[X];
			addRatingToPlayers(playersRatingsById, match.leftPlayers, match.KDleft);
			addRatingToPlayers(playersRatingsById, match.rightPlayers, match.KDright);
		}
		
		users.getPlayersByIds({}, function(playersById)
		{
			var items = [];
			for(X in playersRatingsById)
			{
				items.push({text:playersById[X].name, value:playersRatingsById[X]});
			}
			items.sort(function(a,b)
			{
				return b.value - a.value;
			});
			
			if(items.length > playerLimit)
			{
				if(playerLimit > 1)
				{
					var last = items.pop();
					var start = playerLimit - 1;
					items.splice(start, items.length - start);
					items.push(last);
				}
				else
				{
					items.splice(1, items.length - 1);
				}
			}
			
			callback({item:items});
		});
		
		
	});
	
	
	function addRatingToPlayers(playersRatingsById, playerIds, rating)
	{
		for(var X in playerIds)
		{
			var playerId = playerIds[X];
			if(!playersRatingsById[playerId])
			{
				playersRatingsById[playerId] = 0;
			}
			playersRatingsById[playerId] += rating;
		}
	}
	
}