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
	var playerIdsInMatch = matchData.leftPlayers.concat(matchData.rightPlayers);
	for(var X in playerIdsInMatch)
	{
		var player = playersById[playerIdsInMatch[X]];
		if(player.isGuest == true)
		{
			matchData.KDleft = 0;
			matchData.KDright = 0;
			return true;
		}
	}
	for(var X in ratingSystems)
	{
		var ratingSystem = ratingSystems[X];
		if(ratingSystem == mainRatingSystem)
		{
			var ratingChange = ratingSystem.getRatingChange(playersById, matchData.leftPlayers, matchData.rightPlayers, matchData.leftScore, matchData.rightScore);
			matchData.KDleft = ratingChange.leftRating;
			matchData.KDright = ratingChange.rightRating;
		}
		ratingSystem.updateStatsOfPlayersByIdForMatch(playersById, matchData);
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