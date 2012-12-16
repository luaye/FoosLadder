function PlayersView(loadableTable)
{

var players;
var table = loadableTable;
var self = this;

var sortKey = "stats.elo.mixed.score";
var sortReversed;
var commentsInitialised;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.element.show();
	addFBCommentsIfRequired();
	if(players == null)
	{
		self.loadPlayers();
	}
}

this.hide = function()
{
	table.element.hide();
}

this.onReloading = function()
{
	table.clear();
	table.setLoading(true);
}

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, onPlayersLoaded);
}

this.setPlayers = function(data)
{
	onPlayersLoaded(data)
}

this.updateRows = function()
{
	table.clear();
	table.setLoading(true);
}

function onPlayersLoaded(data)
{
	players = data.concat();
	updateSort();
}

function updateRows()
{
	table.setLoading(false);
	table.clear();
	
	var X;
	var userRow;
	for(X in players)
	{
		userRow = table.createRow();
		fillRowWithUser(userRow, players[X]);
	}
}

function fillRowWithUser(tableRow, user)
{
	if(user.stats == null) user.stats = {};
	var kdr = user.stats.kdr;
	var versus = user.stats.versus;
	
	var userLink = "<a href='javascript:inspect(\""+user.id+"\")'>"+user.name+"</a>";
	
	var goalsFor = Number(kdr.mixed.goalsFor);
	var goalsAgainst = Number(kdr.mixed.goalsAgainst);
	var goalAvg = Math.round(kdr.mixed.goalAvg*100) / 100;
	if (isNaN(goalAvg)) goalAvg = "-";
	
	var stats = user.stats;
	
	var image = getPlayerImageElement(user, 30);
	$(tableRow).find("playerImage").replaceWith(image);
	setContentsOfTag(tableRow, "playerName", userLink);
	setContentsOfTag(tableRow, "heads", safeSlashNum(versus._heads, versus._total));
	setContentsOfTag(tableRow, "mixedScore", safeStr(stats.elo.mixed.score));
	setContentsOfTag(tableRow, "duoScore", safeStr(stats.elo.duo.score));
	setContentsOfTag(tableRow, "duoWins", safeSlashNum(stats.kdr.duo.wins, stats.kdr.duo.games));
	setContentsOfTag(tableRow, "soloScore", safeStr(user.stats.elo.solo.score));
	setContentsOfTag(tableRow, "soloWins", safeSlashNum(stats.kdr.solo.wins, stats.kdr.solo.games));
	setContentsOfTag(tableRow, "goalAvg", goalAvg);
}

function safeStr(obj)
{
	if(obj != undefined)
	{
		return Math.round(Number(obj));
	}
	return "";
}

function safeSlashNum(num1, num2)
{
	if(num1 == undefined) num1 = 0;
	if(num2 == undefined) num2 = 0;
	if(num1 == 0 && num2 == 0)
	{
		return "";
	}
	return num1 + " / " + num2;
}

this.addPlayer = function()
{
	if(players == null)
	{
		alert("User loading in progress.");
		return;
	}
	
	ensureAuthorisedAndCall(addPlayerAfterAuth);
}

function addPlayerAfterAuth()
{
	var dialog = $('#addPlayerModal');
	dialog.modal('show');
}

this.onAddSubmit = function()
{
	var name = $("#addPlayerName").val();
	var facebookId = $("#addPlayerFBId").val();
	var experience = $("#addPlayerExp").val();
	
	var request = {request:"addPlayer", 
		fbAccessToken:facebookAccessToken, 
		name:name, 
		facebookId:facebookId, 
		initialExperience:experience
	};
	
	if(facebookId && facebookId.length > 1)
	{
		$.get("http://graph.facebook.com/"+facebookId,
		{},
		function(data)
		{
			if(data.name)
			{
				callAPI(request, onPlayerAdded);
			}
			else
			{
				alert("Error validating facebook ID\n" + JSON.stringify(data));
			}
		},
		"json").error(function() {
				alert("Error validating facebook ID");
		});
	}
	else
	{
		callAPI(request, onPlayerAdded);
	}
}

function resetAddPlayer()
{
	$("#addPlayerName").val("");
	$("#addPlayerFBId").val("");
	$("#addPlayerExp").val("");
}

function onPlayerAdded(response)
{
	if(response.status == "error")
	{
		alert(response.message ? response.message : "Error adding player.")
	}
	else
	{
		resetAddPlayer();
		var dialog = $('#addPlayerModal');
		dialog.modal('hide');
		self.loadPlayers();
	}
}

this.toggleSortBy = function(key)
{
	if(sortKey == key)
	{
		sortReversed = !sortReversed;
	}
	else
	{
		sortReversed = false;
		sortKey = key;
	}
	updateSort();
}

function updateSort()
{
	var properties = sortKey.split(".");
	players.sort(function(a, b)
	{
		var avalue = readPropertyChain(a, properties);
		var bvalue = readPropertyChain(b, properties);
		if(typeof avalue == "string") 
		{
			avalue = avalue.toLowerCase();
		}
		if(typeof bvalue == "string") 
		{
			bvalue = bvalue.toLowerCase();
		}
		var value = 0;
		
		if(avalue < bvalue)
		{
			value = 1;
		}
		else if(avalue > bvalue)
		{
			value = -1;
		}
		if(sortReversed)
		{
			return -value;
		}
		return value;
	});
	updateRows();
}

function readPropertyChain(obj, properties)
{
	for( var X in properties)
	{
		obj = obj[properties[X]];
		if(obj == null)
		{
			return "";
		}
	}
	return obj;
}

this.rebuiltStats = function()
{
	ensureAuthorisedAndCall(function()
	{
		table.clear();
		table.setLoading(true);
		callAPI({request:"rebuiltMatchStats"}, onRebuiltMatchStats);
	});
}

this.repeatMatches = function()
{
	ensureAuthorisedAndCall(function()
	{
		table.clear();
		table.setLoading(true);
		callAPI({request:"repeatMatchStats"}, onRebuiltMatchStats);
	});
}

function onRebuiltMatchStats(ok)
{
	self.loadPlayers();
	if(!ok)
	{
		alert("Failed");
	}
}

function addFBCommentsIfRequired()
{
	if(commentsInitialised) return;
	commentsInitialised = true;
	
	var commentArea = table.element.find(".commentCell");
	var width = table.element.innerWidth() - 15;
		
	commentArea.html('<div class="fb-comments" data-href="'+makeCommentURL("players")+'" data-num-posts="6" data-width="'+width+'" mobile="false"></div>');
	FB.XFBML.parse(commentArea[0]);
}

}
