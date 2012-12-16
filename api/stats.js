var kdr = require("./rating/kdr.js");
var elo = require("./rating/elo.js");
var avg = require("./rating/avg.js");
var versus = require("./rating/versus.js");

/*
Methods required for all rating systems:
resetPlayerStats(player): void
updateStatsOfPlayersByIdForMatch(playersById, matchData): void

Methods required for main rating system:
getRatingOfPlayer(player): Number
getExpectedScores(playersById, leftPlayerIds, rightPlayerIds): {leftScore:Number, rightScore:Number}
getRatingChange(playersById, leftPlayerIds, rightPlayerIds, leftScore, rightScore): {leftRating:Number, rightRating:Number}
*/

var mainRatingSystem = new avg.Avg();

var ratingSystems = [
	kdr.getSystem(),
	mainRatingSystem, 
	elo.getSystem(elo.MODE_MIXED),
	elo.getSystem(elo.MODE_SOLO), 
	elo.getSystem(elo.MODE_DUO),
	versus
	];


exports.resetPlayerStats = function(player)
{
	player.stats = {};
	for(var X in ratingSystems)
	{
		ratingSystems[X].resetPlayerStats(player);
	}
}

exports.getExpectedScores = function (playersById, leftPlayerIds, rightPlayerIds)
{
	return mainRatingSystem.getExpectedScores(playersById, leftPlayerIds, rightPlayerIds);
}

exports.getRatingChange = function(playersById, leftPlayerIds, rightPlayerIds, leftScore, rightScore)
{
	return mainRatingSystem.getRatingChange(playersById, leftPlayerIds, rightPlayerIds, leftScore, rightScore)
}

exports.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
{
	matchData.preLeftRatings = getPlayerRatingListByPlayerIds(matchData.leftPlayers, playersById);
	matchData.preRightRatings = getPlayerRatingListByPlayerIds(matchData.rightPlayers, playersById);
	for(var X in ratingSystems)
	{
		ratingSystems[X].updateStatsOfPlayersByIdForMatch(playersById, matchData);
	}
	return true;
}


function getPlayerRatingListByPlayerIds(playerIds, playersById)
{
	var result = [];
	var player, rating;
	for (var index in playerIds)
	{
		player = playersById[playerIds[index]];
		rating = mainRatingSystem.getRatingOfPlayer(player);
		result.push(rating);
	}
	return result;
}