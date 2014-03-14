var RATIO_OF_SETUP_MATCHES = 0.0;
var CSV_FILENAME = 'algos.csv';

var users = require("./api/users.js");
var matches = require("./api/matches.js");
var elo = require("./api/rating/avg.js");
var uncertain = require("./api/rating/uncertain.js");
var glicko = require("./api/rating/glicko.js");
var random = require("./api/random.js");
var fs = require("fs");

exports.run = function() {
	runContest();
}

function runContest() {
	console.log("Saving CSV results to "+process.cwd()+"/"+CSV_FILENAME);
	//fs.writeFileSync(CSV_FILENAME, 'name,k,ratio,err\n', '', function(err){if(err) throw err;});
//	fs.writeFileSync(CSV_FILENAME, 'name,beg,exp,adv,err\n', '', function(err){if(err) throw err;});
	fs.writeFileSync(CSV_FILENAME, 'name,err\n', '', function(err){if(err) throw err;});
	matches.getMatches({}, function(allMatchDatas)
	{
		users.getPlayersByIds({}, function(playersById)
		{
			function isGuest(playerId) {
				var player = playersById[playerId];
				return player.name.lastIndexOf("Guest", 0) === 0;
			}
			var matchDatas = allMatchDatas
				//.filter(function(matchData) { return matchData.leftPlayers.length == 1 && matchData.rightPlayers.length == 1 })
				.filter(function(matchData) { return matchData.leftPlayers.length == matchData.rightPlayers.length })
				.filter(function(matchData) { return !(matchData.leftPlayers.some(isGuest) || matchData.rightPlayers.some(isGuest)) })
				;
			console.log("got matches: "+matchDatas.length);
			
			var best = { err : 1 };
			var algos = { elo: new elo.Avg(), gli: new glicko.Glicko() };
			var algo, x;
			for (name in algos)
			{
				//var name = 'elo';
				algo = algos[name];
				var params = { weakPlayerRatio: 0 };
				//for (var feedback = 0; feedback <= 1; feedback++)
				var feedback = 0;
				{
					params.contributionFeedback = feedback == 1;
					//for (var k = 30; k < 240; k+= 5)
					var k = 110;
					{
						params.maxK = k;
						//for (var whichRatio = 0; whichRatio <= 1; whichRatio++)
						var whichRatio = 0;
						{
							//for (var ratio = 0.05; ratio <= 0.8; ratio += 0.05)
							var ratio = 0.5;
							{
								if (whichRatio == 0) {
									params.defensivePlayerRatio = ratio;
									params.weakPlayerRatio = 0;
								} else {
									params.weakPlayerRatio = ratio;
								}
								
								for (var numSeeds = 0; numSeeds < 1; numSeeds++)
								{
									var seeds = [];
									seeds[0] = Math.round(Math.random() * 1400);
									seeds[1] = Math.round(seeds[0] + Math.random() * 1000);
									seeds[2] = Math.round(seeds[1] + Math.random() * 1000);
									params.seededRatings = seeds;
			
//									algo.setParameters(params);
									
									var error = runAlgo(algo, matchDatas, playersById);
//									var logdata = [ name ].concat(seeds).concat([ error ]);
									var logdata = [ name, error ];
//									var logdata = [ name, k, ratio, error ];
									var line = logdata.join(',')+'\n';
									fs.appendFileSync(CSV_FILENAME, line, '', function(err){if(err) throw err;});
									if (error < best.err) {
										best.err = error;
										best.parameters = JSON.stringify(params);
										best.name = name;
									}
									
								}
							}
						}
					}
				}
			}
						
			best.parameters = JSON.parse(best.parameters);
			console.log("BEST: "+JSON.stringify(best));
			
			//playersById.sort(function(a,b) { return a.stats.glicko.getRating() - b.stats.glicko.getRating()});
			var arr = [];
			for (var id in playersById) {
				arr.push(id);
			}
			arr.sort(function(a,b) { return playersById[a].stats.glicko.getRating() - playersById[b].stats.glicko.getRating()});
			for (var idx in arr) {
				console.log(algos.gli.playerToString(playersById[arr[idx]]));
			}

			
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
		users.resetPlayerStats(playersById[X]);
	}
	
	var totalError = 0;
	var matchesProcessed = 0;
	
	for(X in matchDatas)
	{
		var matchData = matchDatas[X];
		
		//var error = ratingAlgo.updateRatingForMatch(playersById, getMixedStats, matchData);	
		var error = ratingAlgo.updateStatsOfPlayersByIdForMatch(playersById, matchData);
		
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
