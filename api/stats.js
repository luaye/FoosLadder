var ratingAlgo = require("./elo.js");

exports.clearPlayerStats = function(player)
{
	player.soloStats = null;
	player.duoStats = null;
	player.mixedStats = null;
	player.versus = null;
}

exports.getExpectedScores = function (playersById, leftPlayers, rightPlayers)
{
	var Rleft = ratingAlgo.getCombinedRatingOfPlayers(playersById, getMixedStats, leftPlayers);
	var Rright = ratingAlgo.getCombinedRatingOfPlayers(playersById, getMixedStats, rightPlayers);
	
	var Es = ratingAlgo.expectedScoreForRating(Rleft, Rright);
		
	return {leftScore:getLeftGoalsGivenExpectedScore(Es), rightScore:getRightGoalsGivenExpectedScore(Es)};
}

exports.getRatingChange = function(playersById, leftPlayers, rightPlayers, leftScore, rightScore)
{
	var KDleft = ratingAlgo.getLeftRatingChange(playersById, getMixedStats, leftPlayers, Number(leftScore), rightPlayers, Number(rightScore));
	return {leftRating:KDleft, rightRating:-KDleft};
}

exports.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
{
	var isDuoGame = matchData.leftPlayers.length > 1 || matchData.rightPlayers.length > 1;
	var getStatsFunction = isDuoGame ? getDuoStats : getSoloStats;
	
	matchData.preLeftRatings = getPlayerMixedRatingListByPlayerIds(matchData.leftPlayers, playersById);
	matchData.preRightRatings = getPlayerMixedRatingListByPlayerIds(matchData.rightPlayers, playersById);
	
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



function getLeftGoalsGivenExpectedScore(Es)
{
	if(Es > 0.5)
	{
		return 10;
	}
	else
	{
		return getLoserGoalsGivenExpectedScore(Es);
	}
}

function getRightGoalsGivenExpectedScore(Es)
{
	if(Es < 0.5)
	{
		return 10;
	}
	else
	{
		return getLoserGoalsGivenExpectedScore(Es);
	}
}

function getLoserGoalsGivenExpectedScore(Es)
{
	var minExpected = Es > 0.5 ? (1-Es) : Es;
	var goals = 10 * minExpected / (1-minExpected);
	return 10 * minExpected / (1-minExpected);
}


function getPlayerMixedRatingListByPlayerIds(playerIds, playersById)
{
	var result = [];
	var player, stats, score;
	for (var index in playerIds)
	{
		player = playersById[playerIds[index]];
		stats = getMixedStats(player);
		score = getProperty(stats, "score", defaultScoreForPlayer(player));
		result.push(getProperty(stats, "score", defaultScoreForPlayer(player)));
	}
	return result;
}

function defaultScoreForPlayer(player)
{
	return ratingAlgo.defaultScoreForPlayer(player);
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

