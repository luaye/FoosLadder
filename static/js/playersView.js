function PlayersView(loadableTable)
{

var players;
var companies;
var table = loadableTable;
var self = this;

var sortKey = "stats.avg.rating";
var sortReversed;
var commentsInitialised;
var shouldShowAllPlayers = false;

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

this.setCompanies = function(data)
{
	onCompaniesLoaded(data)
}

this.showAllPlayers = function()
{
	$(".showAllPlayers").hide();
	shouldShowAllPlayers = true;
	updateRows();
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

function onCompaniesLoaded(data)
{
	companies = data.concat();
}

function updateRows()
{
	table.setLoading(false);
	table.clear();

	var X;
	var userRow;
	for(X in players)
	{
		var player = players[X];
		if(player.isGuest != true && (shouldShowAllPlayers || !player.inactive))
		{
			userRow = table.createRow();
			fillRowWithUser(userRow, player);
		}
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
	var company = user.company;
	if (company == null)
		company = "";

	var image = getPlayerImageElement(user, 30);
	var row = $(tableRow);
	row.find("playerImage").replaceWith(image);
	setContentsOfTag(tableRow, "playerName", userLink);
	setContentsOfTag(tableRow, "playerCompany", company);
	setContentsOfTag(tableRow, "duoWins", safeSlashNum(stats.kdr.duo.wins, stats.kdr.duo.games, stats.kdr.duo.kdr));
	setContentsOfTag(tableRow, "soloWins", safeSlashNum(stats.kdr.solo.wins, stats.kdr.solo.games, stats.kdr.solo.kdr));

	var ratingtags = row.find("rating");
	ratingtags.each(function(index)
	{
		var ratingtag = $(this);
		var str = safeStr(readPropertyChainStr(user, String(ratingtag.attr("path"))));
		ratingtag.text(str);
	});
}

function safeStr(obj, decimals)
{
	if(!decimals) decimals = 1;
	if(obj != undefined)
	{
		return Math.round(Number(obj) * decimals) / decimals;
	}
	return "";
}

function safeSlashNum()
{
	var arr = [];
	for(var X in arguments)
	{
		var num = arguments[X];
		if(isNaN(num)) num = 0;
		arr.push(safeStr(num, 100));
	}
	return arr.join(" / ");
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
	var options = $("#addPlayerCompany");
	$.each(companies, function() {
	    options.append($("<option />").val(this.name).text(this.name));
	});
	dialog.modal('show');
}

this.onAddSubmit = function()
{
	var name = $("#addPlayerName").val();
	var company = $("#addPlayerCompany").val();
	var facebookId = $("#addPlayerFBId").val();
	var experience = $("#addPlayerExp").val();

	var request = {request:"addPlayer",
		fbAccessToken:facebookAccessToken,
		name:name,
		company:company,
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
