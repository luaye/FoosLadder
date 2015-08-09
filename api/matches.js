var users = require("./users.js");
var utils = require("./../utils.js");

exports.getMatches = function(body, callback)
{
    matches = GLOBAL.matchesDB.view('matches', 'by_date', body,
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("matches.getMatches error: "+error);
			callback([]);
		}
		else
		{
			//console.log("matches.getMatches OK: " + JSON.stringify(body.rows));
			var result = [];
			for (var X in body.rows)
			{
				var match = body.rows[X].value;
				result.push(match);
			}
			//console.log("matches.getMatches OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}

exports.getMatchesRaw = function(body, callback)
{
    matches = GLOBAL.matchesDB.view('matches', 'by_date',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("matches.getMatchesRaw error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var match = body.rows[X].value;
				result.push(match);
			}
			callback(result);
		}
	});
}


exports.addMatch = function(body, callback)
{
	console.log("matches.addMatch: "+JSON.stringify(body));

	users.isAsscessTokenValidForAdding(body.fbAccessToken, function(ok)
	{
		if(ok)
		{
			console.log("matches.addMatch 1");
			addMatchToDb(body, callback);
		}
		else
		{
			console.log("addMatch: NOT AUTHORIZED");
			callback({status:"error", message:"Not authorized."});
		}
	})
}

function addMatchToDb(body, callback)
{
	var matchData = {};

	if(!isNaN(body.date))
	{
		var dateMs = Number(body.date);
		var nowMs = new Date().getTime();
		var hour = 1000 * 60 * 60;
		var allowedPast = hour * 24 * 365;
		var allowedFuture = hour * 2;
		if(dateMs > nowMs - allowedPast && dateMs < nowMs + allowedFuture)
		{
			matchData.date = new Date(dateMs).getTime();
		}
		else
		{
			callback({status:"error", message:"Invalid date."});
			return;
		}
	}
	else
	{
		matchData.date = new Date().getTime();
	}

	matchData.leftPlayers = utils.getLeftPlayersOfObject(body);
	matchData.rightPlayers = utils.getRightPlayersOfObject(body);

	matchData.leftScore = Number(body.leftScore);
	matchData.rightScore = Number(body.rightScore);

	var totalSeconds = Number(body.totalSeconds);
	if(!isNaN(totalSeconds) && totalSeconds > 0)
	{
		matchData.totalSeconds = totalSeconds;
	}

	if(!validateScore(matchData.leftScore) || !validateScore(matchData.rightScore)
	||
	(matchData.leftScore < 5 && matchData.rightScore < 5))
	{
		callback({status:"error", message:"Invalid score."});
		return;
	}

	console.log("matches.addMatch validate players");
	if(!preValidatePlayers(matchData.leftPlayers) || !preValidatePlayers(matchData.rightPlayers))
	{
		callback({status:"error", message:"Invalid players."});
		return;
	}

	console.log("matches.addMatch get users");
	users.getUsers({}, function(users)
	{
		if(validatePlayers(users, matchData.leftPlayers, matchData.rightPlayers))
		{
			console.log("matches.addMatch addMatchToDB");
			addMatchToDatabase(matchData, callback);
		}
		else
		{
			callback({status:"error", message:"Invalid players."});
		}
	});
}

function validateScore(score)
{
	return !isNaN(score) && score >= 0 && score <= 10;
}

function preValidatePlayers(players)
{
	console.log("preValidatePlayers: " + players.length + " - "+ players);
	return players != null && players.length > 0 && players.length <= 2;
}

function validatePlayers(users, players1, players2)
{
	var X;
	for(X in users)
	{
		users[X] = users[X].id;
	}
	var player;
	for(X in players1)
	{
		player = players1[X];
		if(players1.indexOf(player) != X)
		{
			// duplicate
			return false;
		}
		if(users.indexOf(player) < 0)
		{
			return false;
		}
		if(players2.indexOf(player) >= 0)
		{
			return false;
		}
	}
	for(X in players2)
	{
		player = players2[X];
		if(players2.indexOf(player) != X)
		{
			// duplicate
			return false;
		}
		if(users.indexOf(player) < 0)
		{
			return false;
		}
	}
	return true;
}

function addMatchToDatabase(matchData, callback)
{
	users.updatePlayerStatsForMatch(matchData, function(ok)
	{
		if(ok)
		{
			console.log("matches.addMatchToDatabase: "+JSON.stringify(matchData));

			GLOBAL.matchesDBClone.insert(matchData, null, function (error, body, headers)
			{
				if(error || !body)
				{
					console.log("matches.addMatch clonedb error: "+error);
					callback({status:"error"});
				}
				else
				{
					GLOBAL.matchesDB.insert(matchData, null, function (error, body, headers)
					{
						if(error || !body)
						{
							console.log("matches.addMatch db error: "+error);
							callback({status:"error"});
						}
						else
						{
							//console.log("matches.addMatch OK: " + JSON.stringify(body));
							callback({status:"OK"});
						}
					});
				}
			});
		}
		else
		{
			callback({status:"error", message:"unknown"});
		}
	});
}

exports.updateMatch = function(body, callback)
{
	console.log("matches.updateMatch: "+JSON.stringify(body));

	users.isAsscessTokenValidForAdding(body.fbAccessToken, function(ok)
	{
		if(ok)
		{
			updateMatchToDb(body, callback);
		}
		else
		{
			console.log("addMatch: NOT AUTHORIZED");
			callback({status:"error", message:"Not authorized."});
		}
	})
}

function updateMatchToDb(body, callback)
{
	if(!body.id) body.id = "1";

	fetchMatchStatus(body.id, function(matchData)
	{
		if(matchData == null)
		{
			matchData = {};
			matchData._id = body.id;
		}
		if(matchData.timeNow) delete matchData.timeNow;
		matchData.date = new Date().getTime();
		matchData.leftPlayers = utils.getLeftPlayersOfObject(body);
		matchData.rightPlayers = utils.getRightPlayersOfObject(body);
		matchData.leftScore = Number(body.leftScore);
		matchData.rightScore = Number(body.rightScore);
		matchData.leftExpectedScore = Number(body.leftExpectedScore);
		matchData.rightExpectedScore = Number(body.rightExpectedScore);
		matchData.leftRatingChange = Number(body.leftRatingChange);
		matchData.rightRatingChange = Number(body.rightRatingChange);

		var totalSeconds = Number(body.totalSeconds);
		matchData.totalSeconds = !isNaN(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;

		var bulk = {};
		bulk.docs = [matchData];
		GLOBAL.matchStatusDB.bulk(bulk, function (error, body, headers)
		{
			if(error || !body)
			{
				console.log("FAILED TO UPDATE MATCH STATUS.");
				callback({status:"error", message:error ? error : "unknown"});
			}
			else
			{
				console.log("Updated match status " + body);
				callback({status:"OK"});
			}
		});
	});
}

function fetchMatchStatus(id, callback)
{
	if(!id) id = "1";
	GLOBAL.matchStatusDB.fetch({keys:[id]}, function (error, body, headers)
	{
		if(error || !body || body.rows.length == 0)
		{
			callback(null);
		}
		else
		{
			var doc = body.rows[0].doc;
			callback((doc && doc.date) ? doc : null);
		}
	});
}

exports.getMatchStatus = function(req, callback)
{
	if(!req.id) req.id = "1";
	fetchMatchStatus(req.id, function(matchData)
	{
		if(matchData)
		{
			matchData.dateNow = new Date().getTime();
			delete matchData._rev;
			if(req.useNames)
			{
				users.getPlayersByIds({}, function(playersById)
				{
					var leftPlayers = matchData.leftPlayers;
					var rightPlayers = matchData.rightPlayers;
					for(var X in leftPlayers)
					{
						var id = leftPlayers[X];
						if(playersById[id])
						{
							leftPlayers[X] = playersById[id].name;
						}
					}

					for(var X in rightPlayers)
					{
						var id = rightPlayers[X];
						if(playersById[id])
						{
							rightPlayers[X] = playersById[id].name;
						}
					}
					callback(matchData);
				});
			}
			else
			{
				callback(matchData);
			}
		}
		else
		{
			callback({});
		}
	});
}

exports.repeatMatchStats = function(body, callback)
{
	exports.getMatches({}, function(matchDatas)
	{
		users.rebuiltPlayerStatsFromMatches(matchDatas, function(ok)
		{
			callback(ok);
		}, true);
	});
}

exports.rebuiltMatchStats = function(body, callback)
{
	exports.getMatches({}, function(matchDatas)
	{
		users.rebuiltPlayerStatsFromMatches(matchDatas, function(ok)
		{
			callback(ok);
		}, false);
	});
}
