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
		return obj;
	}
	
	this.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
	{
		var player, playerId, X, teamPlayerIds, iswinner;
		var winnerIds = utils.getWinnerIds(matchData);
		var loserIds = utils.getLoserIds(matchData);
		
		var playerIds = utils.getPlayerIds(matchData);
		for (X in playerIds)
		{
			playerId = playerIds[X];
			player = playersById[playerId];
			didWin = winnerIds.indexOf(playerId) >= 0;
			teamPlayerIds = didWin ? winnerIds : loserIds;
			add(player, playerId, teamPlayerIds, didWin);
		}
	}
	
	function add(player, playerId, teamPlayerIds, didWin)
	{
		var kdr = player.stats.kdr;
		
		if(didWin) kdr.mixed.wins++;
		kdr.mixed.games++;
		kdr.mixed.kdr = kdr.mixed.wins / kdr.mixed.games;
		
		if(teamPlayerIds.length == 1)
		{
			if(didWin) kdr.solo.wins++;
			kdr.solo.games++;
			kdr.solo.kdr = kdr.solo.wins / kdr.solo.games;
		}
		else
		{
			if(didWin) kdr.duo.wins++;
			kdr.duo.games++;
			kdr.duo.kdr = kdr.duo.wins / kdr.duo.games;
			
			var side = kdr.defence;
			if(teamPlayerIds[0] == playerId)
			{
				side = kdr.offence;
			}
			
			if(didWin) side.wins++;
			side.games++;
			side.kdr = side.wins / side.games;
		}
	}
}