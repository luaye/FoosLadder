var utils = require("./../../utils.js");
var config = require("./../../config.json");
var glicko2lib = require("./glicko2.js");

var SEEDED_RATINGS = [ config.beginnerRating, config.experiencedRating, config.advancedRating ];

 var settings = {
              tau : 0.5,
              rpd : 604800,
              rating : 1500,
              rd : 300,
              vol : 0.06
            };
            
var glicko2 = new glicko2lib.Glicko2(settings);

exports.Glicko = Glicko;

function Glicko()
{
	var self = this;

        this.setParameters = function(param)
	{
		if(param.seededRatings) SEEDED_RATINGS = param.seededRatings;
	}

        this.getPlayerRank = function (player)
        {
             var playerGlicko = player.stats.glicko;
             return playerGlicko.calculateDisplayRank();
        }
        
	this.resetPlayerStats = function(player)
	{
             var defaultRating = defaultScoreForPlayer(player);
            player.stats.glicko = glicko2.makePlayer(defaultRating);
            player.stats.glicko.rank = this.getPlayerRank(player);
        }
        
        this.playerToString = function (player)
        {
             var playerGlicko = player.stats.glicko;
             return player.name+" -> "+playerGlicko.makeString();
        }
        
        this.consolidatePlayerRatings = function()
        {
             
        }

	this.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
	{
             var leftPlayer1 = playersById[matchData.leftPlayers[0]];
             var rightPlayer1 = playersById[matchData.rightPlayers[0]];
             var leftPlayer2, rightPlayer2;
             
             if (matchData.leftPlayers.length > 1 && matchData.rightPlayers.length > 1) {
                          leftPlayer2 = playersById[matchData.leftPlayers[1]];
                          rightPlayer2 = playersById[matchData.rightPlayers[1]];
             }
             
		     var Rleft = getCombinedRatingOfPlayers(playersById, matchData.leftPlayers);
             var Rright = getCombinedRatingOfPlayers(playersById, matchData.rightPlayers);
		     var Eleft = expectedScoreForRating(Rleft, Rright);
             
             var Sleft = getLeftFractionalScore(matchData.leftScore, matchData.rightScore);
             
             //console.log("was "+self.playerToString(leftPlayer1) + " vs "+self.playerToString(rightPlayer1)+" expected "+Eleft.toFixed(2)+" got "+Sleft.toFixed(2));
             glicko2.cleanPreviousMatches();
             
             if (leftPlayer2)
                          glicko2.addTeamResult(leftPlayer1.stats.glicko, leftPlayer2.stats.glicko, rightPlayer1.stats.glicko, rightPlayer2.stats.glicko, Sleft);
             else
                          glicko2.addResult(leftPlayer1.stats.glicko, rightPlayer1.stats.glicko, Sleft);
                          
             glicko2.calculatePlayersRatings();
                          
             //console.log("now "+self.playerToString(leftPlayer1) + " vs "+self.playerToString(rightPlayer1));
                          
            return Eleft - Sleft;
        }
        
	function getCombinedRatingOfPlayers(playersById, playerIds)
	{
		var player = playersById[playerIds[0]];
		var rating;
		if(playerIds.length == 1)
		{
                        rating = player.stats.glicko.getRating();
		}
		else
		{
                        rating = player.stats.glicko.getRating();
			player = playersById[playerIds[1]];
                        rating += player.stats.glicko.getRating();
		}
		return rating / playerIds.length;
	}
        
	function expectedScoreForRating (rating, opponent)
	{
		var Qa = Math.pow(10, (rating / 400));
		var Qb = Math.pow(10, (opponent / 400));
		var Es = Qa / (Qa + Qb);
		return Es;
	}
        
	function getLeftFractionalScore(leftScore, rightScore) {
		var Gleft = leftScore;
		var Gtotal = Gleft + rightScore;
		var Sleft = Gleft / Gtotal;
		
		return Sleft;
	}
        	
        function defaultScoreForPlayer (player)
	{
		var initialExperience = player.initialExperience;
		if(initialExperience == 1)
		{
			return SEEDED_RATINGS[0];
		}
		else if(initialExperience == 3)
		{
			return SEEDED_RATINGS[2];
		}
		return SEEDED_RATINGS[1];
	}
	

}