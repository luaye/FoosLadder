var RATIO_OF_SETUP_MATCHES = 0.7;
var CSV_FILENAME = 'algos.csv';

var users = require("./api/users.js");
var matches = require("./api/matches.js");
//var init = require("./api/init.js");
var elo = require("./api/elo.js");
var random = require("./api/random.js");
var fs = require("fs");

console.log(process.cwd());
//init.init();

exports.run = function() {
	runContest();
}

function runContest() {
	fs.writeFileSync(CSV_FILENAME, 'name,k,ratio,err\n', '', function(err){if(err) throw err;});
	matches.getMatches({}, function(matchDatas)
	{
		console.log("got matches: "+matchDatas.length);
		users.getPlayersByIds({}, function(playersById)
		{
			var best = { err : 1 };
			var algos = { elo: elo, random: random };
			var algo, x;
			//for (name in algos)
			{
				var name = 'elo';
				algo = algos[name];
	// 			for (var setup = 0.5; setup < 0.95; setup += 0.05) 
				{
	// 				RATIO_OF_SETUP_MATCHES = setup;
					for (var k = 30; k < 240; k+= 5) {
						algo.setMaxK(k);
						for (var ratio = 0.05; ratio < 0.95; ratio += 0.05) {
							algo.setWeakPlayerRatio(0);
							algo.setDefensivePlayerRatio(ratio);
							var error = runAlgo(algo, matchDatas, playersById);
							var logdata = [ name, k, ratio, error ];
							var line = logdata.join(',')+'\n';
							fs.appendFileSync(CSV_FILENAME, line, '', function(err){if(err) throw err;});
		//					console.log("K = "+k+" Weak Ratio = "+ratio+", error = "+error);
							if (error < best.err) {
								best.err = error;
								best.k = k;
								best.ratio = ratio;
								best.name = name;
	// 							best.setup = setup;
							}
						}
					}
				}
			}
						
			console.log("BEST: "+JSON.stringify(best));
			process.exit();
		});		
	});
}

function runAlgo(ratingAlgo, matchDatas, playersById) 
{
	var totalMatches = matchDatas.length;
	var numSetupMatches = Math.round(totalMatches * RATIO_OF_SETUP_MATCHES);
		
	var X;
	for(X in playersById)
	{
		users.clearPlayerStats(playersById[X]);
	}
	
	var totalError = 0;
	var matchesProcessed = 0;
	
	for(X in matchDatas)
	{
		var matchData = matchDatas[X];
		var error = ratingAlgo.updateRatingForMatch(playersById, getMixedStats, matchData);	
		
		if (++matchesProcessed > numSetupMatches) {
			totalError += error * error;
		}
	}
	
	var avgError = totalError/(totalMatches-numSetupMatches);
	return avgError;
//	console.log("Total squared error: "+totalError+", avg per match: "+avgError);
}

function getMixedStats(player)
{
	if(!player.mixedStats)
	{
		return player.mixedStats = {};
	}
	return player.mixedStats;
}
