var utils = require("./../../utils.js");

var MAX_RATING_CHANGE = 110;
var MIXED_RATING_MAX_RATIO = 0.5;

exports.Avg = Avg;

function Avg()
{
	var self = this;
	
	this.resetPlayerStats = function(player)
	{
		var obj = {};
		player.stats.avg = obj;
		
		var defaultRating = defaultScoreForPlayer(player);
		
		obj.solo = defaultRating;
		obj.offence = defaultRating;
		obj.defence = defaultRating;
		obj.rating = defaultRating;
	}

	this.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
	{
		var changes = self.getRatingChange(playersById, matchData.leftPlayers, matchData.rightPlayers, matchData.leftScore, matchData.rightScore);
		
		
		addRatingToPlayers(playersById, matchData.leftPlayers, changes.leftRating);
		addRatingToPlayers(playersById, matchData.rightPlayers, changes.rightRating);
	}
	
	function addRatingToPlayers(playersById, playerIds, deltaRating)
	{
		var player = playersById[playerIds[0]];
		if(playerIds.length == 1)
		{
			getPlayerStatObj(player).solo += deltaRating;
			updatePlayerMixedRating(player);
		}
		else
		{
			getPlayerStatObj(player).offence += deltaRating;
			updatePlayerMixedRating(player);
			player = playersById[playerIds[1]];
			getPlayerStatObj(player).defence += deltaRating;
			updatePlayerMixedRating(player);
		}
	}
	
	function updatePlayerMixedRating(player)
	{
		var stat = getPlayerStatObj(player);
		var avg = (stat.offence + stat.defence + stat.solo) / 3;
		var max = Math.max(stat.offence, stat.defence, stat.solo);
		stat.rating = ((max * MIXED_RATING_MAX_RATIO) + ( avg * (1 - MIXED_RATING_MAX_RATIO)));
	}
	
	function getLeftRatingChange(playersById, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
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
	
	function getCombinedRatingOfPlayers(playersById, playerIds)
	{
		var player = playersById[playerIds[0]];
		var rating;
		if(playerIds.length == 1)
		{
			rating = getPlayerStatObj(player).solo;
		}
		else
		{
			rating = getPlayerStatObj(player).offence;
			player = playersById[playerIds[1]];
			rating += getPlayerStatObj(player).defence;
		}
		return rating / playerIds.length;
	}
	
	function getPlayerStatObj(player)
	{
		return player.stats.avg;
	}
	
	function expectedScoreForRating (rating, opponent)
	{
		var Qa = Math.pow(10, (rating / 400));
		var Qb = Math.pow(10, (opponent / 400));
		var Es = Qa / (Qa + Qb);
		return Es;
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
			return 1700;
		}
		return 1600;
	}
	
	
	
	
	//
	// For primary rating system usage
	//
	
	this.getRatingOfPlayer = function(player)
	{
		return getPlayerStatObj(player).rating;
	}
	
	this.getExpectedScores = function (playersById, leftPlayerIds, rightPlayerIds)
	{
		var Rleft = getCombinedRatingOfPlayers(playersById, leftPlayerIds);
		var Rright = getCombinedRatingOfPlayers(playersById, rightPlayerIds);
		
		var Es = expectedScoreForRating(Rleft, Rright);
			
		return {leftScore:getLeftGoalsGivenExpectedScore(Es), rightScore:getRightGoalsGivenExpectedScore(Es)};
	}
	
	this.getRatingChange = function(playersById, leftPlayers, rightPlayers, leftScore, rightScore)
	{
		var KDleft = getLeftRatingChange(playersById, leftPlayers, Number(leftScore), rightPlayers, Number(rightScore));
		return {leftRating:KDleft, rightRating:-KDleft};
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
}