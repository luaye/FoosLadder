var utils = require("./../utils.js");
var kdr = require("./rating/kdr.js");
//var elo = require("./rating/elo.js");
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
	/*elo.getSystem(elo.MODE_MIXED),
	elo.getSystem(elo.MODE_SOLO), 
	elo.getSystem(elo.MODE_DUO),
	*/
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
	var idsCombos = [];
	if(playersCount == 2)
	{
		idsCombos.push(mapArrayIndexToIds([1,2]));
	}
	else if(playersCount == 3)
	{
		idsCombos.push(mapArrayIndexToIds([1,2,3]));
		idsCombos.push(mapArrayIndexToIds([1,3,2]));
		idsCombos.push(mapArrayIndexToIds([2,1,3]));
		idsCombos.push(mapArrayIndexToIds([2,3,1]));
		idsCombos.push(mapArrayIndexToIds([3,2,1]));
		idsCombos.push(mapArrayIndexToIds([3,1,2]));
	}
	else if(playersCount == 4)
	{
		idsCombos.push(mapArrayIndexToIds([1,2,3,4]));
		idsCombos.push(mapArrayIndexToIds([1,2,4,3]));
		idsCombos.push(mapArrayIndexToIds([1,3,2,4]));
		idsCombos.push(mapArrayIndexToIds([1,3,4,2]));
		idsCombos.push(mapArrayIndexToIds([1,4,2,3]));
		idsCombos.push(mapArrayIndexToIds([1,4,3,2]));
		
		idsCombos.push(mapArrayIndexToIds([2,1,3,4]));
		idsCombos.push(mapArrayIndexToIds([2,1,4,3]));
		idsCombos.push(mapArrayIndexToIds([2,3,4,1]));
		idsCombos.push(mapArrayIndexToIds([2,4,3,1]));
		
		idsCombos.push(mapArrayIndexToIds([3,1,4,2]));
		idsCombos.push(mapArrayIndexToIds([3,2,4,1]));
	}
	
	function mapArrayIndexToIds(array)
	{
		for(var X in array) array[X] = playerIds[(array[X] - 1)];
		return array;
	}
	
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

exports.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
{
	var playerIdsInMatch = matchData.leftPlayers.concat(matchData.rightPlayers);
	var matchDate = matchData.date;
	var hasGuest = false;
	for(var X in playerIdsInMatch)
	{
		var player = playersById[playerIdsInMatch[X]];
		if(player.isGuest == true)
		{
			hasGuest = true;
		}
		if(!player.firstGame)
		{
			player.firstGame = matchDate;
		}
		player.lastGame = matchDate;
	}
	
	if(hasGuest)
	{
		matchData.KDleft = 0;
		matchData.KDright = 0;
	}
	else
	{
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