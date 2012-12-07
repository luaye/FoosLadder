var kdr = require("./rating/kdr.js");
var elo = require("./rating/elo.js");

/*
Methods required for all rating systems:
resetPlayerStats(player): void
updateStatsOfPlayersByIdForMatch(playersById, matchData): void

Methods required for main rating system:
getRatingOfPlayer(player): Number
getExpectedScores(playersById, leftPlayerIds, rightPlayerIds): {leftScore:Number, rightScore:Number}
getRatingChange(playersById, leftPlayerIds, rightPlayerIds, leftScore, rightScore): {leftRating:Number, rightRating:Number}
*/

var mainRatingSystem = elo.getSystem(elo.MODE_MIXED);

var ratingSystems = [
	kdr.getSystem(),
	mainRatingSystem, 
	elo.getSystem(elo.MODE_SOLO), 
	elo.getSystem(elo.MODE_DUO)
	
	];


exports.resetPlayerStats = function(player)
{
	ensureStatsObject(player);
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
	
	var isDuoGame = matchData.leftPlayers.length > 1 || matchData.rightPlayers.length > 1;
	var getStatsFunction = isDuoGame ? getDuoStats : getSoloStats;
	
	
	ratingAlgo.updateRatingForMatch(playersById, getStatsFunction, matchData);
	ratingAlgo.updateRatingForMatch(playersById, getMixedStats, matchData);

	var winners = [];
	var losers;
	if(matchData.leftScore > matchData.rightScore)
	{
		winners = matchData.leftPlayers;
		losers = matchData.rightPlayers;
	}
	else if(matchData.leftScore < matchData.rightScore)
	{
		winners = matchData.rightPlayers;
		losers = matchData.leftPlayers;
	}
	else
	{
		losers = matchData.rightPlayers.concat(matchData.leftPlayers);
	}
	
	var X, Y;
	for (X in winners)
	{
		player = playersById[winners[X]];
		stats = getStatsFunction(player);
		addToProperty(stats, "wins", 1);
		addToProperty(stats, "games", 1);
		addToProperty(stats, "goalsFor", Math.max(matchData.leftScore, matchData.rightScore));
		addToProperty(stats, "goalsAgainst", Math.min(matchData.leftScore, matchData.rightScore));
		versus = getVersusStats(player);
		for (Y in losers)
		{
			var other = playersById[losers[Y]];
			if (!isDuoGame)
				addVersusResult(versus, other, 1);
		}
		
		tallyVersusHeads(versus);
	}
	
	for (X in losers)
	{
		player = playersById[losers[X]];
		stats = getStatsFunction(player);
		addToProperty(stats, "games", 1);
		addToProperty(stats, "goalsFor", Math.min(matchData.leftScore, matchData.rightScore));
		addToProperty(stats, "goalsAgainst", Math.max(matchData.leftScore, matchData.rightScore));
		versus = getVersusStats(player);
		for (Y in winners)
		{
			var other = playersById[winners[Y]];
			if (!isDuoGame)
				addVersusResult(versus, other, -1);
		}
		
		tallyVersusHeads(versus);
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

function addToProperty(obj, property, value)
{
	if(!obj[property])
	{
		return obj[property] = value;
	}
	return obj[property] += value;
}

function getProperty(obj, property, defaultValue)
{
	if(!obj[property])
		return defaultValue;
		
	return obj[property];
}

function getMixedStats(player)
{
	if(!player.mixedStats)
	{
		return player.mixedStats = {};
	}
	return player.mixedStats;
}

function getDuoStats(player)
{
	if(!player.duoStats)
	{
		return player.duoStats = {};
	}
	return player.duoStats;
}

function getVersusStats(player)
{
	if(!player.versus)
	{
		return player.versus = {};
	}
	return player.versus;
}

function addVersusResult(stats, otherPlayer, win)
{
	var otherName = otherPlayer.name;

	if (!stats[otherName])
		stats[otherName] = {wins:0, losses:0};
		
	if (win >= 0)
		stats[otherName].wins++;
	if (win <= 0)
		stats[otherName].losses++;			
//	console.log(otherName+" w "+stats[otherName].wins+" l "+stats[otherName].losses);
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

function getSoloStats(player)
{
	if(!player.soloStats)
	{
		return player.soloStats = {};
	}
	return player.soloStats;
}


function ensureStatsObject(player)
{
	if(!player.stats) player.stats = {};
}