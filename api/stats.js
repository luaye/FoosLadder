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

exports.getMatchUpsOfPlayers = function(playerIds, playersById)
{
	var playersCount = playerIds.length;
	if(playersCount < 2)return [];
	if(playersCount > 4) return [];
	
	var idsCombos = getCombosOf(playerIds, [], true);
	var idsCombo, combo, leftPlayerIds, rightPlayerIds;
	var len = idsCombos.length;
	var mid = Math.ceil(playersCount * 0.5);
	var result = [];
	for(var i = 0 ; i < len; i++)
	{
		idsCombo = idsCombos[i];
		leftPlayerIds = idsCombo.slice(0, mid);
		rightPlayerIds = idsCombo.slice(mid, playersCount);
		combo = mainRatingSystem.getExpectedScores(playersById, leftPlayerIds, rightPlayerIds);
		combo.leftPlayers = leftPlayerIds;
		combo.rightPlayers = rightPlayerIds;
		result.push(combo);
	}
	
	return result.sort(function (a, b)
	{
		return (b.leftScore + b.rightScore) - (a.leftScore + a.rightScore);
	});
	
}


function getCombosOf(array, prefix, halfLen)
{
	// this still produce a few duplicate teams such as [11,33, 22,44] vs [22,44, 11,33] and [22,33, 11,44] vs [11,44, 22,33]
	var combos = new Array();
	var len = array.length;
	var combo, first, subcombos, lenj, j;
	var hasChildren = prefix.length + 1 < len;
	if(halfLen) len = Math.ceil(len * 0.5);
	for( var i = 0; i < len; i++)
	{
		first = array[i];
		if(prefix.indexOf(first) < 0)
		{
			combo = prefix.concat(first);
			if(hasChildren)
			{
				subcombos = getCombosOf(array, combo);
				lenj = subcombos.length;
				for(j = 0; j < lenj; j++)
				{
					combos.push(subcombos[j]);
				}
			}
			else
			{
				combos.push(combo);
			}
		}
	}
	return combos;
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