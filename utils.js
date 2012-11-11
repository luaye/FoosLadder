var https = require('https');
exports.getFacebookData = function (accessToken, callback)
{
	var options = {
	  host: "graph.facebook.com",
	  port: 443,
	  path: "/me?access_token="+accessToken
	};
	
	//console.log(options.host, options.port, options.path);
	
	https.get(options, function(res) 
	{
		var bodystring = '';
        res.on('data', function (data) {
            bodystring += data;
        });
        res.on('end', function () {
			var obj;
			try
			{
				obj = {status:"ok", body:JSON.parse(bodystring)};
			}
			catch (e) {
			  obj = {status:"error", body:e}
				console.log("getFacebookData ERROR: ", e);
			}
			callback(obj);
        });
	}).on('error', function(e) 
	{
		console.log("getFacebookData: ERROR", e);
	  callback({status:"error", body:e});
	});
}


exports.getLeftPlayersOfObject = function(body)
{
	var players = [];
	addToListIfExists(players, body.leftPlayer1);
	addToListIfExists(players, body.leftPlayer2);
	return players;
}

exports.getRightPlayersOfObject = function(body)
{
	var players = [];
	addToListIfExists(players, body.rightPlayer1);
	addToListIfExists(players, body.rightPlayer2);
	return players;
}

function addToListIfExists(list, value)
{
	if(value)
	{
		list.push(value);
	}
}