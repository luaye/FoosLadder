var utils = require("./../../utils.js");

var MAX_RATING_CHANGE = 110;
var WEAKEST_PLAYER_INFLUENCE_RATIO = 0.5;
var DEFENSIVE_PLAYER_INFLUENCE_RATIO = 0.5;
var CONTRIBUTION_FEEDBACK = false;

exports.MODE_MIXED = "mixed";
exports.MODE_SOLO = "solo";
exports.MODE_DUO = "duo";

exports.getSystem = function(mode)
{
	return new ELO(mode);
}

function ELO(mode)
{

function getStatsFunction(player)
{
	return player.stats.elo[mode];
}

this.resetPlayerStats = function(player)
{
	if(!player.stats.elo)
	{
		player.stats.elo = {};
	}
	var obj = {};
	obj.score = defaultScoreForPlayer(player);
	player.stats.elo[mode] = obj;
}

this.getExpectedScores = function (playersById, leftPlayers, rightPlayers)
{
	var Rleft = getCombinedRatingOfPlayers(playersById, leftPlayers);
	var Rright = getCombinedRatingOfPlayers(playersById, rightPlayers);
	
	var Es = expectedScoreForRating(Rleft, Rright);
		
	return {leftScore:getLeftGoalsGivenExpectedScore(Es), rightScore:getRightGoalsGivenExpectedScore(Es)};
}

this.getRatingChange = function(playersById, leftPlayers, rightPlayers, leftScore, rightScore)
{
	var KDleft = getLeftRatingChange(playersById, leftPlayers, Number(leftScore), rightPlayers, Number(rightScore));
	return {leftRating:KDleft, rightRating:-KDleft};
}

this.getRatingOfPlayer = function(player)
{
	return getStatsFunction(player).score;
}

this.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
{
	var isDuoMatch = utils.isDuoMatch(matchData);
	if(
	mode != exports.MODE_MIXED &&
	(
		(isDuoMatch && mode == exports.MODE_SOLO)
		|| 
		(!isDuoMatch && mode != exports.MODE_SOLO)
	))
	{
		return;
	}
	
	var KDleft = getLeftRatingChange(playersById, matchData.leftPlayers, matchData.leftScore, matchData.rightPlayers, matchData.rightScore);
	
	addRatingToPlayers(playersById, matchData.leftPlayers, KDleft);
	addRatingToPlayers(playersById, matchData.rightPlayers, -KDleft);
	
	return KDleft;
}

this.setParameters = function(param)
{
	if(param.maxK) MAX_RATING_CHANGE = param.maxK;
	if(param.weakPlayerRatio != null) WEAKEST_PLAYER_INFLUENCE_RATIO = param.weakPlayerRatio;
	if(param.defensivePlayerRatio != null) DEFENSIVE_PLAYER_INFLUENCE_RATIO = param.defensivePlayerRatio;
	//if(param.contributionFeedback != null) 
	CONTRIBUTION_FEEDBACK = param.contributionFeedback;
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

/** Returns an object with two arrays with the rating changes to be applied to each player */ 
function getPlayerRatingChanges(playersById, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	var leftChange = calculateLeftRatingChange(playersById, leftPlayerIds, leftScore, rightPlayerIds, rightScore);
	
	var X;
	var leftChanges = [];
	for (X in leftPlayerIds) {
		leftChanges.push(leftChange);
	}
	var rightChanges = [];
	for (X in rightPlayerIds) {
		rightChanges.push(-leftChange);
	}
	
	return { leftRating: leftChanges, rightRating: rightChanges };
}

function calculateLeftRatingChange(playersById, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	var Rleft = getCombinedRatingOfPlayers(playersById, leftPlayerIds);
	var Rright = getCombinedRatingOfPlayers(playersById, rightPlayerIds);
	var Eleft = expectedScoreForRating(Rleft, Rright);
	
	var Gleft = leftScore;
	var Gtotal = Gleft + rightScore;
	var Sleft = Gleft / Gtotal;
	
	var K = MAX_RATING_CHANGE;
	return K * ( Sleft - Eleft );
}

function getLeftRatingChange (playersById, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	// specific in ELO
	var changes = getPlayerRatingChanges(playersById, leftPlayerIds, leftScore, rightPlayerIds, rightScore);
	return changes.leftRating[0];
}

function expectedScoreForRating (rating, opponent)
{
	var Qa = Math.pow(10, (rating / 400));
	var Qb = Math.pow(10, (opponent / 400));
	var Es = Qa / (Qa + Qb);
	return Es;
}

function getCombinedRatingOfPlayers (playersById, players)
{
	var ratings = 0;
	var player;
	var index;
	var stats;
	var first, second;
	
	for (index in players)
	{
		player = playersById[players[index]];
		stats = getStatsFunction(player);
		var score = getProperty(stats, "score", defaultScoreForPlayer(player)); 
		if (!first)
			first = score;
		else
			second = score;
		ratings += score;
	}
	
	if (players.length == 2) {
		var firstContrib = getFirstPlayerContributionToRating(first, second);
		
		var combined = first * firstContrib + second * (1-firstContrib);
//		console.log([ratings, players.length, first, second, firstContrib, combined]);
		return combined;
	}
	
	var average = ratings / players.length;
	if (average < 0)
	{
		console.log("below 0! "+[ratings, players.length]);
	   return 0;
	}
	return average;
}

function getFirstPlayerContributionToRating(first, second)
{	
	if (WEAKEST_PLAYER_INFLUENCE_RATIO > 0) {
		return (first < second) ? WEAKEST_PLAYER_INFLUENCE_RATIO : 1-WEAKEST_PLAYER_INFLUENCE_RATIO;
	} else if (DEFENSIVE_PLAYER_INFLUENCE_RATIO > 0) {
		return 1-DEFENSIVE_PLAYER_INFLUENCE_RATIO; // first is offence
	}
	
	return 0.5;
}		

function defaultScoreForPlayer (player)
{
	var initialExperience = player.initialExperience;
	if(initialExperience == 1)
	{
		return 1500;
	}
	else if(initialExperience == 3)
	{
		return 1750;
	}
	return 1600;
}

function addRatingToPlayers(playersById, players, deltaRating)
{
	var firstPlayer = playersById[players[0]];
	if (players.length == 1)
	{
		addRatingToPlayer(firstPlayer, deltaRating);
	}
	else if (players.length == 2 && CONTRIBUTION_FEEDBACK)
	{
		var stats;
		var secondPlayer = playersById[players[1]];
		var firstScore = getProperty(getStatsFunction(firstPlayer), "score", defaultScoreForPlayer(player)); 
		var secondScore = getProperty(getStatsFunction(secondPlayer), "score", defaultScoreForPlayer(player)); 
		var firstContrib = getFirstPlayerContributionToRating(firstScore, secondScore);
	
//		console.log(firstPlayer.name+" contrib "+firstContrib+" delta "+deltaRating);


		addRatingToPlayer(firstPlayer, 2 * deltaRating * firstContrib);
		addRatingToPlayer(secondPlayer, 2 * deltaRating * (1-firstContrib));
	}
	else
	{
		var player;
		var index;
		for (index in players)
		{
			player = playersById[players[index]];
			addRatingToPlayer(player, deltaRating);
	// 		console.log(player.name+" "+Math.round(score)+" -> "+Math.round(score+deltaRating));
		}
	}
}

function addRatingToPlayer(player, deltaRating)
{
	var stats = getStatsFunction(player);
	score = getProperty(stats, "score", defaultScoreForPlayer(player));
//	console.log(player.name+" "+Math.round(score)+" -> "+Math.round(score+deltaRating));
	stats["score"] = score + deltaRating;
}


function getProperty(obj, property, defaultValue)
{
	if(!obj[property])
		return defaultValue;
		
	return obj[property];
}

}
