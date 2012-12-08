var utils = require("./../../utils.js");

exports.getSystem = function(mode)
{
	return new KDR(mode);
}

function KDR(mode)
{
	function getObject(player)
	{
		return player.stats.kdr[mode];
	}
	
	this.resetPlayerStats = function(player)
	{
		var kdr = {};
		kdr.mixed = createBlank();
		kdr.solo = createBlank();
		kdr.duo = createBlank();
		kdr.offence = createBlank();
		kdr.defence = createBlank();
		
		player.stats.kdr = kdr;
	}
	
	function createBlank()
	{
		var obj = {};
		obj.wins = 0;
		obj.games = 0;
		obj.kdr = 0;
		obj.goalsFor = 0;
		obj.goalsAgainst = 0;
		obj.goalAvg = 0;
		return obj;
	}
	
	this.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
	{
		var player, playerId, X, teamPlayerIds, didWin;
		var winnerIds = utils.getWinnerIds(matchData);
		var loserIds = utils.getLoserIds(matchData);
		
		var playerIds = utils.getPlayerIds(matchData);
		for (X in playerIds)
		{
			playerId = playerIds[X];
			player = playersById[playerId];
			didWin = winnerIds.indexOf(playerId) >= 0;
			teamPlayerIds = didWin ? winnerIds : loserIds;
			
			var kdr = player.stats.kdr;
			addToObj(kdr.mixed, didWin, matchData);
			
			if(teamPlayerIds.length == 1)
			{
				addToObj(kdr.solo, didWin, matchData);
			}
			else
			{
				addToObj(kdr.duo, didWin, matchData);
				
				if(teamPlayerIds[0] == playerId)
				{
					addToObj(kdr.offence, didWin, matchData);
				}
				else
				{
					addToObj(kdr.defence, didWin, matchData);
				}
			}
		}
	}
	
	function addToObj(obj, didWin, matchData)
	{
		if(didWin)
		{
			obj.wins++;
			obj.goalsFor += Math.max(matchData.leftScore, matchData.rightScore);
			obj.goalsAgainst += Math.min(matchData.leftScore, matchData.rightScore);
		}
		else
		{
			obj.goalsFor += Math.min(matchData.leftScore, matchData.rightScore);
			obj.goalsAgainst += Math.max(matchData.leftScore, matchData.rightScore);
		}
		obj.goalAvg = obj.goalsFor * 10.0 / (obj.goalsFor + obj.goalsAgainst);
		obj.games++;
		obj.kdr = obj.wins / obj.games;
	}
}