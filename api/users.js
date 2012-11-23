var utils = require("./../utils.js");
var config = require("./../config.json");
var ratingAlgo = require("./elo.js");

exports.getUsers = function(body, callback)
{
	GLOBAL.usersDB.view('users', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.getUsers error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var user = body.rows[X].value;
				user.id = user._id;
				delete user._id;
				delete user._rev;
				result.push(user);
			}
			//console.log("users.getUsers OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}

exports.getPlayersByIds = function(body, callback)
{
    matches = GLOBAL.usersDB.view('users', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.getUsersById error: "+error);
			callback({});
		}
		else
		{
			var result = {};
			for (var X in body.rows)
			{
				var user = body.rows[X].value;
				result[user._id] = user;
			}
			//console.log("users.getUsersById OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}

exports.addUser = function(body, callback)
{
	//console.log("users.addUser: "+body.name);
	
	exports.isAsscessTokenValidForAdding(body.fbAccessToken, function(ok) {
		if(ok)
		{
			addUserToDB(body.name, callback);
		}
		else
		{
			console.log("addUser: "+ body.name +" NOT AUTHORIZED");
			callback({status:"error", message:"Not authorized."});
		}
	});	
}

function addUserToDB(name, callback)
{
	GLOBAL.usersDB.insert({name: name}, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.addUser error: "+error);
			callback({status:"error", message:error.message});
		}
		else
		{
			console.log("users.addUser OK: " + JSON.stringify(body));
			callback({status:"ok"});
		}
	});
}

exports.updatePlayerStatsForMatch = function(matchData, callback)
{
	//console.log("users.updatePlayerStatsForMatch: "+JSON.stringify(matchData));
	var playerIds = matchData.leftPlayers.concat(matchData.rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		if(playersById == null)
		{
			console.log("FAILED TO GET PLAYER STATS TO UPDATE FOR MATCH.");
			callback(false);
			return;
		}
		
		var OK = updateStatsOfPlayersByIdForMatch(playersById, matchData);
		if(!OK)
		{
			console.log("FAILED TO CALCULATE PLAYER STATS FOR MATCH.");
			callback(false);
			return;
		}
		updatePlayersByIdToDatabase(playersById, function(ok)
		{
			callback(ok);
		});
	});
}

exports.getExpectedScores = function(body, callback)
{
	var leftPlayers = utils.getLeftPlayersOfObject(body);
	var rightPlayers = utils.getRightPlayersOfObject(body);
	
	if(leftPlayers.length == 0 || rightPlayers.length == 0)
	{
		callback({leftScore:0, rightScore:0});
		return;
	}
	
	var playerIds = leftPlayers.concat(rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		var Rleft = getCombinedRatingOfPlayers(playersById, getMixedStats, leftPlayers);
		var Rright = getCombinedRatingOfPlayers(playersById, getMixedStats, rightPlayers);
	
		var Es = expectedScoreForRating(Rleft, Rright);
		
		callback({leftScore:getLeftGoalsGivenExpectedScore(Es), rightScore:getRightGoalsGivenExpectedScore(Es)});
	});
}

exports.getRatingChange = function(body, callback)
{
	var leftPlayers = utils.getLeftPlayersOfObject(body);
	var rightPlayers = utils.getRightPlayersOfObject(body);
	
	if(leftPlayers.length == 0 || rightPlayers.length == 0)
	{
		callback({leftRating:0, rightRating:0});
		return;
	}
	
	var playerIds = leftPlayers.concat(rightPlayers);
	getPlayersByIdUsingIds(playerIds, function(playersById)
	{
		var KDleft = getLeftRatingChange(playersById, getMixedStats, leftPlayers, Number(body.leftScore), rightPlayers, Number(body.rightScore));
	
		callback({leftRating:KDleft, rightRating:-KDleft});
	});
	
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

function getPlayersByIdUsingIds(playerIds, callback)
{
	var playersById = {};
	GLOBAL.usersDB.fetch({keys:playerIds}, function (error, body, headers)
	{
		if(error || !body)
		{
			callback(null);
		}
		else
		{
			for (var X in body.rows)
			{
				var row = body.rows[X];
				playersById[row.id] = row.doc;
			}
			for (var X in playerIds)
			{
				var playerid = playerIds[X];
				if(playersById[playerid] == null)
				{
					playersById[playerid] = {};
				}
			}
			
			callback(playersById);
		}
	});
}

function getCombinedRatingOfPlayers(playersById, getStatsFunction, players)
{
	var ratings = 0;
	var player;
	var index;
	var stats;
	for (index in players)
	{
		player = playersById[players[index]];
		stats = getStatsFunction(player);
		ratings += getProperty(stats, "score", defaultScoreForPlayer(player));
	}
	
	var average = ratings / players.length;
	if (average < 0)
	{
		console.log("below 0! "+[ratings, players.length]);
	   return 0;
	}
	return average;
}

function expectedScoreForRating(rating, opponent)
{
	var Qa = Math.pow(10, (rating / 400));
	var Qb = Math.pow(10, (opponent / 400));
	var Es = Qa / (Qa + Qb);
// 	console.log("Es "+[Qa, Qb, Es]);
	return Es;
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


function addRatingToPlayers(playersById, getStatsFunction, players, deltaRating)
{
	var player;
	var index;
	var stats;
	for (index in players)
	{
		player = playersById[players[index]];
		stats = getStatsFunction(player);
		score = getProperty(stats, "score", defaultScoreForPlayer(player));
		stats["score"] = score + deltaRating;
		console.log(player.name+" "+Math.round(score)+" -> "+Math.round(score+deltaRating));
	}
}

function defaultScoreForPlayer(player)
{
	return 1600;
	
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
	 
	return 1600;
}

function updateRatingForMatch(playersById, getStatsFunction, o)
{
	var KDleft = getLeftRatingChange(playersById, getStatsFunction, o.leftPlayers, o.leftScore, o.rightPlayers, o.rightScore);
	
	o.KDleft = KDleft;
	
	addRatingToPlayers(playersById, getStatsFunction, o.leftPlayers, KDleft);
	addRatingToPlayers(playersById, getStatsFunction, o.rightPlayers, -KDleft);
}

function getLeftRatingChange(playersById, getStatsFunction, leftPlayerIds, leftScore, rightPlayerIds, rightScore)
{
	var Rleft = getCombinedRatingOfPlayers(playersById, getStatsFunction, leftPlayerIds);
	var Rright = getCombinedRatingOfPlayers(playersById, getStatsFunction, rightPlayerIds);
	var Eleft = expectedScoreForRating(Rleft, Rright);
	
	var Gleft = leftScore;
	var Gtotal = Gleft + rightScore;
	var Sleft = Gleft / Gtotal;
	
	var K = config.maxRatingChange;
	return K * ( Sleft - Eleft );
}

function updateStatsOfPlayersByIdForMatch(playersById, matchData)
{
	var isDuoGame = matchData.leftPlayers.length > 1 || matchData.rightPlayers.length > 1;
	var getStatsFunction = isDuoGame ? getDuoStats : getSoloStats;
	
	matchData.preLeftRatings = getPlayerMixedRatingListByPlayerIds(matchData.leftPlayers, playersById);
	matchData.preRightRatings = getPlayerMixedRatingListByPlayerIds(matchData.rightPlayers, playersById);
	
	updateRatingForMatch(playersById, getStatsFunction, matchData);
	updateRatingForMatch(playersById, getMixedStats, matchData);

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

exports.rebuiltPlayerStatsFromMatches = function(matchDatas, callback, keepOldStats)
{
	exports.getPlayersByIds({}, function(playersById)
	{
		var X;
		if (!keepOldStats)
		{
			console.log("Erasing stats for players...");
			for(X in playersById)
			{
				clearPlayerStats(playersById[X]);
			}
		}
		var iterations = keepOldStats ? 100 : 1;
		for (var i=0; i < iterations; i++)
		{
			for(X in matchDatas)
			{
				var OK = updateStatsOfPlayersByIdForMatch(playersById, matchDatas[X]);
				if(!OK)
				{
					console.log("FAILED TO CALCULATE PLAYER STATS FOR MATCH.");
					callback(false);
					return;
				}
			}
		}
		updateMatchesToDatabase(matchDatas, function(ok)
		{
			console.log("updating matches: "+ok);
		});
		updatePlayersByIdToDatabase(playersById, function(ok)
		{
			callback(ok);
		});
	});
}

function updateMatchesToDatabase(matchDatas, callback)
{
	var bulk = {};
	bulk.docs = [];
	
	for (X in matchDatas)
	{
		bulk.docs.push(matchDatas[X]);
	}

	GLOBAL.matchesDB.bulk(bulk, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("FAILED TO UPDATE MATCH STATS.");
			callback(false);
		}
		else
		{
			console.log("Updated match stats.");
			callback(true);
		}
	});
}

function updatePlayersByIdToDatabase(playersById, callback)
{
	var bulk = {};
	bulk.docs = [];
	for (X in playersById)
	{
		bulk.docs.push(playersById[X]);
	}
		
	GLOBAL.usersDB.bulk(bulk, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("FAILED TO UPDATE PLAYER STATS FOR MATCH.");
			callback(false);
		}
		else
		{
			console.log("Updated player stats for match.");
			callback(true);
		}
	});
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

function clearPlayerStats(player)
{
	player.soloStats = null;
	player.duoStats = null;
	player.mixedStats = null;
	player.versus = null;
}

exports.isAsscessTokenValidForAdding = function(accessToken, callback)
{
	if(config.useFacebookAuth == false)
	{
		callback(true);
		return;
	}
	if(accessToken == null) {
		callback(false);
		return;
	}
	if(accessToken == config.secretAuthKey)
	{
		callback(true);
		return;
	}
	utils.getFacebookData(accessToken, function (response)
	{
		if(response.status == "ok")
		{
			var id = response.body.id;
			var username = response.body.username;
			if(config.allowedFacebookIds.indexOf(id) >= 0 || config.allowedFacebookIds.indexOf(username) >= 0)
			{
				callback(true);
			}
			else
			{
				exports.getPlayersByIds({}, function (playersById)
				{
					var found = false;
					for (var X in playersById)
					{
						var player = playersById[X];
						if(player.facebookId == id || player.facebookId == username)
						{
							found = true;
							break;
						}
					}
					callback(found);
				});
			}
		}
		else
		{
			console.log("isAsscessTokenValidForAdding: FAILED", response.body.message);
			callback(false);
		}
	})	
}