
exports.getUsers = function(body, callback)
{
    matches = GLOBAL.usersDB.view('users', 'by_name',
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
			console.log("users.getUsers OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}


exports.addUser = function(body, callback)
{
	console.log("users.addUser: "+body.name);
	GLOBAL.usersDB.insert({name: body.name}, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("users.addUser error: "+error);
			callback({status:"error"});
		}
		else
		{
			console.log("users.addUser OK: " + JSON.stringify(body));
			callback({status:"OK"});
		}
	});
}

exports.updatePlayerStatsForMatch = function(matchData, callback)
{
	console.log("users.updatePlayerStatsForMatch: "+JSON.stringify(matchData));
	
	var winners;
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
	
	return;
	// TODO.
	
	var X;
	var player;
	for(X in matchData.leftPlayers)
	{
		player = matchData.leftPlayers[X];
		var won = winners && winners.indexOf(player) >= 0;
		
		GLOBAL.usersDB.get(player, function (error, body, headers)
		{
			if(error || !body)
			{
				console.log("users.get error: "+error);
			}
			else
			{
				
				console.log("users.get result: "+JSON.stringify(body));
				
				GLOBAL.usersDB.insert(body, body._id, function (error, body, headers)
				{
					if(error || !body)
					{
						console.log("users.updateUser error: "+error);
					}
				});
			}
		});
	}
}
