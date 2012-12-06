var MAX_RATING_CHANGE = 110;
var WEAKEST_PLAYER_INFLUENCE_RATIO = 0.5;
var DEFENSIVE_PLAYER_INFLUENCE_RATIO = 0.5;

exports.setParameters = function(param)
{
	if(param.maxK) MAX_RATING_CHANGE = param.maxK;
	if(param.weakPlayerRatio != null) WEAKEST_PLAYER_INFLUENCE_RATIO = param.weakPlayerRatio;
	if(param.defensivePlayerRatio != null) DEFENSIVE_PLAYER_INFLUENCE_RATIO = param.defensivePlayerRatio;
}

exports.setMaxK = function(maxK)
{
	MAX_RATING_CHANGE = maxK;
}
exports.setWeakPlayerRatio = function(ratio)
{
	WEAKEST_PLAYER_INFLUENCE_RATIO = ratio;
}
exports.setDefensivePlayerRatio = function(ratio)
{
	DEFENSIVE_PLAYER_INFLUENCE_RATIO = ratio;
}

exports.updateRatingForMatch = function(playersById, getStatsFunction, matchData)
{
	var KDleft = exports.getLeftRatingChange(playersById, getStatsFunction, matchData.leftPlayers, matchData.leftScore, matchData.rightPlayers, matchData.rightScore);
	
	matchData.KDleft = KDleft;
	
	addRatingToPlayers(playersById, getStatsFunction, matchData.leftPlayers, KDleft);
	addRatingToPlayers(playersById, getStatsFunction, matchData.rightPlayers, -KDleft);
	

	return KDleft / MAX_RATING_CHANGE;
}

/** Returns an object with two arrays with the rating changes to be applied to each player */ 
exports.getPlayerRatingChanges = function(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	var leftChange = calculateLeftRatingChange(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore);
	
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

function calculateLeftRatingChange(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	var Rleft = exports.getCombinedRatingOfPlayers(playersById, getStatsFunction, leftPlayerIds);
	var Rright = exports.getCombinedRatingOfPlayers(playersById, getStatsFunction, rightPlayerIds);
	var Eleft = exports.expectedScoreForRating(Rleft, Rright);
	
	var Gleft = leftScore;
	var Gtotal = Gleft + rightScore;
	var Sleft = Gleft / Gtotal;
	
	var K = MAX_RATING_CHANGE;
	return K * ( Sleft - Eleft );
}

exports.getLeftRatingChange = function(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	// specific in ELO
	var changes = exports.getPlayerRatingChanges(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore);
	return changes.leftRating[0];
}

exports.expectedScoreForRating = function(rating, opponent)
{
	var Qa = Math.pow(10, (rating / 400));
	var Qb = Math.pow(10, (opponent / 400));
	var Es = Qa / (Qa + Qb);
	return Es;
}

exports.getCombinedRatingOfPlayers = function(playersById, getStatsFunction, players)
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
		var score = getProperty(stats, "score", exports.defaultScoreForPlayer(player)); 
		if (!first)
			first = score;
		else
			second = score;
		ratings += score;
	}
	
	if (players.length == 2) {
		if (WEAKEST_PLAYER_INFLUENCE_RATIO > 0) {		
			var weakest = first;
			var strongest = second;
			if (weakest > strongest) {
				var t = weakest; weakest = strongest; strongest = t;
			}
			var combined = weakest * WEAKEST_PLAYER_INFLUENCE_RATIO + strongest * (1-WEAKEST_PLAYER_INFLUENCE_RATIO);
	//		console.log([ratings, players.length, strongest, weakest, combined]);
			return combined;
		} else if (DEFENSIVE_PLAYER_INFLUENCE_RATIO > 0) {
			var combined = second * DEFENSIVE_PLAYER_INFLUENCE_RATIO + first * (1-DEFENSIVE_PLAYER_INFLUENCE_RATIO);
//			console.log([ratings, players.length, second, first, combined]);
			return combined;
		}
	}
	
	var average = ratings / players.length;
	if (average < 0)
	{
		console.log("below 0! "+[ratings, players.length]);
	   return 0;
	}
	return average;
}

exports.defaultScoreForPlayer = function(player)
{
   /**		
	var defaults = {
		"Lu Aye Oo": 1800, 
		"John E": 1700, 
		"Pedro R": 1600, 
		"Stephen C": 1600,
		"Simon H": 1500,
		"Adam S": 1500,
		"Naree S": 1400,
		"Joe R": 1400,
		"Andy S": 1400,
		"Toby M": 1500,
	};
	if (defaults[player.name]) return defaults[player.name];
/**/	 
	return 1600;
}

function addRatingToPlayers(playersById, getStatsFunction, players, deltaRating)
{
	var player;
	var index;
	var stats;
	for (index in players)
	{
		player = playersById[players[index]];
		stats = getStatsFunction(player);
		score = getProperty(stats, "score", exports.defaultScoreForPlayer(player));
		stats["score"] = score + deltaRating;
// 		console.log(player.name+" "+Math.round(score)+" -> "+Math.round(score+deltaRating));
	}
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

