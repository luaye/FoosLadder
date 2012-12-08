var utils = require("./../../utils.js");

exports.resetPlayerStats = function(player)
{
	player.stats.versus = {};
}
	
exports.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
{
	var winnerIds = utils.getWinnerIds(matchData);
	var loserIds = utils.getLoserIds(matchData);

	var X, Y, versus;
	for (X in winnerIds)
	{
		player = playersById[winnerIds[X]];
		versus = player.stats.versus;
		for (Y in loserIds)
		{
			var other = playersById[loserIds[Y]];
			//if (!isDuoGame)
				addVersusResult(player.stats.versus, other, 1);
		}
		tallyVersusHeads(versus);
	}
	
	for (X in loserIds)
	{
		player = playersById[loserIds[X]];
		versus = player.stats.versus;
		for (Y in winnerIds)
		{
			var other = playersById[winnerIds[Y]];
			//if (!isDuoGame)
				addVersusResult(player.stats.versus, other, -1);
		}
		
		tallyVersusHeads(versus);
	}
}

function addVersusResult(stats, otherPlayer, win)
{
	var otherId = otherPlayer.id;

	if (!stats[otherId])
		stats[otherId] = {wins:0, losses:0};
		
	if (win >= 0)
		stats[otherId].wins++;
	if (win <= 0)
		stats[otherId].losses++;
}

function tallyVersusHeads(versus)
{
	var heads = 0;
	var total = 0;
	for(var X in versus)
	{
		if (X.charAt(0) == '_') continue;
		var other = versus[X];
		total++;
		if(other.wins > other.losses)
			heads++;
	}
	
	versus._heads = heads;
	versus._total = total;
}