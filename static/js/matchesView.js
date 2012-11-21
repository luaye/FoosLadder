function MatchesView(loadableTable)
{
	
var table = loadableTable;
var sampleComment = table.element.find("#sampleComment");
sampleComment.remove();
var self = this;
var playersById;
var exportText;
var matches;
var commentToShowOnLoad;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.element.show();
	if(playersById == null)
	{
		self.loadPlayers();
		self.loadMatches();
	}
	else if(matches == null)
	{
		self.loadMatches();
	}
}

this.hide = function()
{
	table.element.hide();
}

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, self.setPlayers);
}

this.setPlayers = function(players)
{
	playersById = {};
	for (var X in players)
	{
		var player = players[X];
		playersById[player.id] = player;
	}
}

this.onReloading = function()
{
	table.clear();
	table.setLoading(true);
}

this.loadMatches = function()
{
	callAPI({request:"getMatches"}, self.setMatches);
}

this.setMatches = function(data)
{
	matches = data;
	table.setLoading(false);
	table.clear();
	
	var playerRow;
	for(var i = data.length - 1; i >= 0; i--)
	{
		playerRow = table.createRow();
		fillRowWithMatch(playerRow, data[i]);
	}
	if(commentToShowOnLoad)
	{
		self.toggleMatchBox(commentToShowOnLoad);
		$('html, body').animate({
			 scrollTop: $("#match-" + commentToShowOnLoad).offset().top
		 }, 1000);
		commentToShowOnLoad = null;
	}
}

function fillRowWithMatch(tableRow, match)
{
	var date = new Date(match.date);
	var cellIdx = 1;
	var change = Math.round(Number(match.KDleft)*100)/100;
	var colors = [ '#1A1', '#E55' ];
	
	var leftScoreChange = getChildByTag(tableRow, "leftScoreChange");
	leftScoreChange.style.cssText = 'color: '+colors[change > 0 ? 0 : 1];
	setContentsOfTag(tableRow, "leftScoreChange", change);
	setContentsOfTag(tableRow, "leftAttacker", getPlayerNameFromId(match.leftPlayers[0]));
	setContentsOfTag(tableRow, "leftDefender", match.leftPlayers.length > 1 ? getPlayerNameFromId(match.leftPlayers[1]) : "");
	setContentsOfTag(tableRow, "leftScore", match.leftScore);
	
	var rightScoreChange = getChildByTag(tableRow, "rightScoreChange");
	rightScoreChange.style.cssText = 'color: '+colors[change > 0 ? 1 : 0];
	setContentsOfTag(tableRow, "rightScoreChange", -change);
	setContentsOfTag(tableRow, "rightAttacker", getPlayerNameFromId(match.rightPlayers[0]));
	setContentsOfTag(tableRow, "rightDefender", match.rightPlayers.length > 1 ? getPlayerNameFromId(match.rightPlayers[1]) : "");
	setContentsOfTag(tableRow, "rightScore", match.rightScore);
	
	var dateStr = date.getDate() + ", "+ (date.getMonth()+1) + ", " + date.getFullYear() + "<br/>" + doubleDigit(date.getHours()) + ":" + doubleDigit(date.getMinutes());
	setContentsOfTag(tableRow, "matchDate", dateStr);
	
	var matchId = match._id;
	tableRow.id = "match-"+matchId;
	var commentCount = getChildByTag(tableRow, "commentToggle");
	commentCount.innerHTML = getCommentCountNodeString("match/"+matchId);
	FB.XFBML.parse(commentCount);
	
	$(tableRow).click(function() {
		self.toggleMatchBox(matchId);
	});
}



this.toggleMatchBox = function(matchId)
{
	var rowid = "matchcomment-"+matchId;
	var holder = $("#"+rowid);
	if(holder.length > 0)
	{
		holder.remove();
	}
	else
	{
		holder = sampleComment.clone();
		holder.attr("id", rowid);
		
		var fbkey = "match/"+matchId;
		var matchRow = $("#match-"+matchId);
		
		var commentArea = holder.find(".commentArea");
		
		var width = matchRow.innerWidth() - 20;
		
		commentArea.replaceWith('<div class="fb-comments" data-href="'+makeCommentURL(fbkey)+'" data-num-posts="4" data-width="'+width+'" mobile="false"></div>');
		FB.XFBML.parse(holder[0]);
		
		holder.insertAfter(matchRow);
	}
}

this.gotoComment = function (matchId)
{
	if(matches)
	{
		self.toggleMatchBox(matchId);
	}
	else
	{
		commentToShowOnLoad = matchId;
	}
}

function getPlayerNameFromId(playerId)
{
	var player = playersById[playerId];
	return player ? player.name : "";
}

function doubleDigit(number)
{
	if(number < 10)
	{
		return "0"+number;
	}
	return ""+number;
}


function onRebuiltMatchStats(ok)
{
	self.loadMatches();
	alert(ok ? "Successful" : "Failed");
}
}
