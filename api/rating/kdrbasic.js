var utils = require("./../../utils.js");


exports.resetPlayerStats = function(player)
{
	var obj = {};
	obj.wins = 0;
	obj.games = 0;
	obj.kdr = 0;
	
	player.stats.kdr = obj;
}

exports.getExpectedScores = function(playersById, leftPlayerIds, rightPlayerIds)
{
	return {};
}

exports.getRatingChange = function(playersById, leftPlayerIds, rightPlayerIds, leftScore, rightScore)
{
	return {};
}

exports.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
{
	var player, X;
	var playerIds = utils.getWinnerIds(matchData);
	for (X in playerIds)
	{
		player = playersById[playerIds[X]];
		player.stats.kdr.wins++;
	}
	
	playerIds = utils.getPlayerIds(matchData);
	for (X in playerIds)
	{
		player = playersById[playerIds[X]];
		player.stats.kdr.games++;
		player.stats.kdr.kdr = player.stats.kdr.wins / player.stats.kdr.games;
	}
}