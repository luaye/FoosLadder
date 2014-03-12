var utils = require("./../../utils.js");
var config = require("./../../config.json");
var glicko2lib = require("./glicko2.js");

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
//		if(param.seededRatings) SEEDED_RATINGS = param.seededRatings;
	}

	this.resetPlayerStats = function(player)
	{
            player.stats.glicko = glicko2.makePlayer();
        }
        
        this.playerToString = function (player)
        {
             var playerGlicko = player.stats.glicko;
             return player.name+" ("+playerGlicko.getRating()+","+playerGlicko.getRd()+")";
        }

	this.updateStatsOfPlayersByIdForMatch = function(playersById, matchData)
	{
             var leftPlayer = playersById[matchData.leftPlayers[0]];
             var rightPlayer = playersById[matchData.rightPlayers[0]];
             
             var Rleft = leftPlayer.stats.glicko.getRating();
             var Rright = rightPlayer.stats.glicko.getRating();
	     var Eleft = expectedScoreForRating(Rleft, Rright);
             
             var Sleft = getLeftFractionalScore(matchData.leftScore, matchData.rightScore);
             
             console.log("was "+self.playerToString(leftPlayer) + " vs "+self.playerToString(rightPlayer)+" expected "+Eleft.toFixed(2)+" got "+Sleft.toFixed(2));
             
             glicko2.addResult(leftPlayer.stats.glicko, rightPlayer.stats.glicko, Sleft);
             glicko2.calculatePlayersRatings();
                          
             console.log("now "+self.playerToString(leftPlayer) + " vs "+self.playerToString(rightPlayer));
             
            return Eleft - Sleft;
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
        
}