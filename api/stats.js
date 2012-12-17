var utils = require("./../utils.js");
var kdr = require("./rating/kdr.js");
var elo = require("./rating/elo.js");
var avg = require("./rating/avg.js");
var versus = require("./rating/versus.js");

/*
Methods required for all rating systems:
resetPlayerStats(player): void
updateStatsOfPlayersByIdForMatch(playersById, matchData): void

Methods required for main rating system:
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
	
var matchRatingChangePaths =
	{
		avg:"stats.avg.rating",
		avgSolo:"stats.avg.solo",
		avgOffence:"stats.avg.offence",
		avgDefence:"stats.avg.defence",
		kdrSolo:"stats.kdr.solo.kdr",
		kdrDuo:"stats.kdr.duo.kdr"
	};

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
	
	matchData.leftChanges = getPlayerRatingListByPlayerIds(matchData.leftPlayers, playersById);
	matchData.rightChanges = getPlayerRatingListByPlayerIds(matchData.rightPlayers, playersById);
	
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
	var result = {};
	var player, rating, path, group, index;
	for(var X in matchRatingChangePaths)
	{
		path = matchRatingChangePaths[X];
		result[X] = group = [];
		
		for (index in playerIds)
		{
			player = playersById[playerIds[index]];
			rating = utils.readPropertyChainStr(player, path);
			group.push(rating);
		}
	}
	return result;
}

function getPlayerRatingChangesList(playerIds, playersById, srcObject)
{
	var result = {};
	var player, rating, path, group, srcGroup, index;
	for(var X in matchRatingChangePaths)
	{
		path = matchRatingChangePaths[X];
		srcGroup = srcObject[X];
		result[X] = group = [];
		
		for (index in playerIds)
		{
			player = playersById[playerIds[index]];
			rating = utils.readPropertyChainStr(player, path);
			group[index] = rating - srcGroup[index];
		}
	}
	return result;
}