var matches = require("./matches.js");
var users = require("./users.js");

exports.getRecentGainers = function(body, callback)
{
	var playerLimit = !isNaN(body.limit) ? body.limit : 3;
	var matchLimit = !isNaN(body.matchLimit) ? body.matchLimit : 10;
	var rounding = !isNaN(body.rounding) ? body.rounding : 100;
	
	matches.getMatches({limit:matchLimit, descending:true}, function(matches)
	{
		var playersRatingsById = {};
		var match, X;
		for (X in matches)
		{
			match = matches[X];
			addRatingToPlayers(playersRatingsById, match.leftPlayers, match.KDleft);
			addRatingToPlayers(playersRatingsById, match.rightPlayers, match.KDright);
		}
		
		users.getPlayersByIds({}, function(playersById)
		{
			var items = [];
			var value;
			for(X in playersRatingsById)
			{
				value = Math.round(playersRatingsById[X] * rounding) / rounding;
				items.push({text:playersById[X].name, value:value});
			}
			items.sort(function(a,b)
			{
				return b.value - a.value;
			});
			
			if(items.length > playerLimit)
			{
				if(playerLimit > 1)
				{
					var last = items.pop();
					var start = playerLimit - 1;
					items.splice(start, items.length - start);
					items.push(last);
				}
				else
				{
					items.splice(1, items.length - 1);
				}
			}
			
			callback({item:items});
		});
		
		
	});
	
	
	function addRatingToPlayers(playersRatingsById, playerIds, rating)
	{
		for(var X in playerIds)
		{
			var playerId = playerIds[X];
			if(!playersRatingsById[playerId])
			{
				playersRatingsById[playerId] = 0;
			}
			playersRatingsById[playerId] += rating;
		}
	}
	
}
exports.getCustomLeaderboard = function(body, callback)
{
	var scores = GLOBAL.customLeaderboardDB.view('customleaderboard', 'by_table', {key:body.table},
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("matches.getCustomLeaderboard error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var match = body.rows[X].value;
				delete match._rev;
				delete match._id;
				result.push(match);
			}
			callback(result);
		}
	});
}

exports.submitCustomLeaderboard = function(body, callback)
{
	//console.log("submitCustomLeaderboard: "+JSON.stringify(body));
	if(body.table != null && body.name != null)
	{
		delete body.request;
		if(body.table != null) body.table = String(body.table);
		if(body.name != null) body.name = String(body.name);
		if(body.uid != null) body.uid = String(body.uid);
		if(body.score != null) body.score = Number(body.score);
		
		if(body.table.length == 0 || body.name.length == 0)
		{
			callback({status:"error", message:"fields missing"});
			return;
		}
		
		if(body.uid != null && body.uid.length > 0)
		{
			var scores = GLOBAL.customLeaderboardDB.view('customleaderboard', 'by_uid', {key : body.uid},
			function (error, existings, headers)
			{
				var existing = error == null && existings != null && existings.rows.length > 0 ? existings.rows[0].value : null;
				if(existing == null)
				{
					GLOBAL.customLeaderboardDB.insert(body, null, function (error, body, headers)
					{
						if(error || !body)
						{
							console.log("submitCustomLeaderboard insert error: "+error);
							callback({status:"error"});
						}
						else
						{
							callback({status:"OK"});
						}
					});
				}
				else if(isNaN(body.score) || isNaN(existing.score) || Number(existing.score) < body.score)
				{
					body._id = existing._id;
					body._rev = existing._rev;
					var bulk = {};
					bulk.docs = [body];
					GLOBAL.customLeaderboardDB.bulk(bulk, null, function (error, changed, headers)
					{
						if(error || !changed)
						{
							console.log("submitCustomLeaderboard update error: "+error);
							callback({status:"error"});
						}
						else
						{
							//console.log("submitCustomLeaderboard update existing: \n"+JSON.stringify(existing) + " -> \n" +JSON.stringify(body) + " -> \n" +JSON.stringify(changed));
							callback({status:"OK"});
						}
					});
				}
				else
				{
					callback({status:"OK", updated:false});
				}
			});
		}
		else
		{
			GLOBAL.customLeaderboardDB.insert(body, null, function (error, body, headers)
					{
						if(error || !body)
						{
							console.log("submitCustomLeaderboard db error: "+error);
							callback({status:"error"});
						}
						else
						{
							callback({status:"OK"});
						}
		});
		}
	}
	else
	{
		callback({status:"error", message:"bad data"});
	}
}