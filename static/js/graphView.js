function GraphView(view)
{
	var playersById;
	var matches;
	var showing;
	var selectedPlayers;
	
	var colors = ["#C00", "#00C", "#0C0", "#880", "#088", "#808", "#000", "#666", "#999", "#F93", "#7A3", "#39F", "#3F9", "#F39"];

	var graphLoading = $("#graphLoading");
	
	var playerNamesEle = $("graphSelectedPlayers");
	playerNamesEle.empty();
	
	var graph = $("#graphArea");

	var ratingName = "avg";
	var ratingPath = "stats.avg.rating";

this.show = function()
{
	showing = true;
	view.show();
	
	if(playersById == null)
	{
		graphLoading.show();
		self.loadPlayers();
		self.loadMatches();
	}
	else if(matches == null)
	{
		graphLoading.show();
		self.loadMatches();
	}
	else if(selectedPlayers == null)
	{
		selectAllIfEmpty();
	}
	else if(playersById) draw();
}

function selectAllIfEmpty()
{
	if(selectedPlayers == null)
	{
		selectedPlayers = [];
		for (var X in playersById)
		{
			var player = playersById[X];
			if(player.isGuest != true && !player.inactive && player.stats.kdr.mixed.games > 10)
			{
				selectedPlayers.push(player);
			}
		}
		draw();
	}
}

this.hide = function()
{
	showing = false;
	view.hide();
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
	graphLoading.show();
	graph.empty();
}

this.setMatches = function(data)
{
	matches = data.reverse();
	graphLoading.hide();
	if(showing)
	{
		if(selectedPlayers == null)
		{
			selectAllIfEmpty();
		}
		else if(playersById) draw();
	}
}

this.onTypeChange = function()
{
	var typeValue = $("#graphType").val();
	var typeValues = typeValue.split("|");
	ratingName = typeValues[0];
	ratingPath = typeValues[1];
	draw();
}

function draw()
{
	if(!selectedPlayers || selectedPlayers.length == 0)
	{
		graph.empty();
		playerNamesEle.text("");
		return;
	}
	
	var ratingsByPlayerId = {};
	
	var composite, player, playerId, matchi, match, rating, index, color, change, newrating;
	var playerNameHTMLs = [];
	var max = -10000000;
	var min = 10000000;
	
	var ratingPropertyPath = ratingPath.split(".");
	
	for(var selindex in selectedPlayers)
	{
		player = selectedPlayers[selindex];
		playerId = player.id;
		
		var selectionIndex = selectedPlayers.indexOf(player);
		if(selectionIndex < 0)
		{
			continue;
		}
		
		var ratings = [];
		
		ratingsByPlayerId[playerId] = ratings;
		rating = readPropertyChain(player, ratingPropertyPath);
		ratings.push(rating);
		
		for(matchi in matches)
		{
			match = matches[matchi];
			
			if(match.leftChanges && match.rightChanges)
			{
				newrating = NaN;
				index = match.leftPlayers.indexOf(playerId);
				if(index >= 0)
				{
					newrating =  match.leftChanges[ratingName][index];
				}
				else
				{
					index = match.rightPlayers.indexOf(playerId);
					if(index >= 0)
					{
						newrating = match.rightChanges[ratingName][index];
					}
				}
				if(!isNaN(newrating))
				{
					rating = newrating;
					min = Math.min(min, rating);
					max = Math.max(max, rating);
				}
				ratings.push(rating);
			}
		}
	}
	
	for(var playerId in ratingsByPlayerId)
	{
		player = playersById[playerId];
		var ratings = ratingsByPlayerId[playerId];
		ratings = ratings.reverse();
		var selectionIndex = selectedPlayers.indexOf(player);
		
		color = colors[selectionIndex % colors.length];
		
		graph.sparkline(ratings, {
			fillColor:false,
			lineWidth:1,
			lineColor:color,
			chartRangeMin:min,
			chartRangeMax:max,
			chartRangeClip:true,
			height:600,
			width:view.innerWidth()-10,
			composite:composite
		});
		composite = true;
		
		playerNameHTMLs.push(" <a href='javascript:graphView.clearPlayer("+ selectionIndex +");'><span style='color:"+color+"'>" + player.name + "</span></a>");
		
	}
	
	
	playerNamesEle.html(playerNameHTMLs.join(" | "));
}

this.clearPlayer = function(selectionIndex)
{
	selectedPlayers.splice(selectionIndex, 1);
	draw();
}

this.clearPlayers = function()
{
	selectedPlayers = [];
	draw();
}

this.selectPlayers = function()
{
	hideActivePlayerSelectDialog();
	
	if(!selectedPlayers) selectedPlayers = [];
	
	var options = {};
	options.inactivePlayers = selectedPlayers;
	
	showPlayerSelectionDialog(function(dialog, player)
	{
		if(player)
		{
			var index = selectedPlayers.indexOf(player)
			if(index >= 0)
			{
				selectedPlayers.splice(index, 1);
			}
			else
			{
				selectedPlayers.push(player);
			}
			draw();
		}
	}, "Select players", playersById, options);
}
}
