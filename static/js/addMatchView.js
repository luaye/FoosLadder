
function AddMatchView(tableElement)
{

var table = tableElement;
var players;
var playersById = {};
var self = this;
var leftPlayer1;
var leftPlayer2;
var rightPlayer1;
var rightPlayer2;
var dateNowCheckbox = document.getElementById("dateNow");
var datePicker = document.getElementById("datePicker");
var submitButton = document.getElementById("submit");
var activePlayerSelectDialog;

$('#datePicker').datetimepicker();
updateDateSelectorVisibility();

this.show = function()
{
	table.style.display = 'inherit';
	if(players == null)
	{
		self.loadPlayers();
	}
}

this.hide = function()
{
	table.style.display  = 'none';
	hideActivePlayerSelectDialog();
}

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, onPlayersLoaded);
}

this.setPlayers = function(data)
{
	onPlayersLoaded(data)
}

this.onMatchAdded = function()
{
	// override
}

function onPlayersLoaded(data)
{
	players = data;
	
	playersById = {};
	for (var X in players)
	{
		var player = players[X];
		console.log(player);
		playersById[player.id] = player;
	}
	updateViewNames();
}

function averagePlayerRatings(field1, field2)
{
	var rating = 0;
	var nPlayers = 0;
	
	var player = playersById[field1];
	if (player) {
		rating += player.mixedStats.score;
		nPlayers++;
	}
	player = playersById[field2];
	if (player) {
		rating += player.mixedStats.score;
		nPlayers++;
	}
	
	if (nPlayers == 0) return 0;
	
	return rating / nPlayers;
}

function expectedScoreForRating(rating, opponent)
{
	var Qa = Math.pow(10, (rating / 400));
	var Qb = Math.pow(10, (opponent / 400));
	var Es = Qa / (Qa + Qb);
	return Es;
}

function updateRatings()
{
	var rightRating = averagePlayerRatings(rightPlayer1, rightPlayer2);
	
	rightRating.innerHTML = Math.round(rightRating);
	
	var leftRating = averagePlayerRatings(leftPlayer1, leftPlayer2);
	
	leftRating.innerHTML = Math.round(leftRating);
	
	var Es = expectedScoreForRating(leftRating, rightRating);
	var leftWins = Es > 0.5;
	var minExpected = leftWins ? (1-Es) : Es;
	var loserGoals = 10 * minExpected / (1-minExpected);
	var leftGoals, rightGoals;
	if (leftWins)
	{
		leftGoals = 10;
		rightGoals = Math.round(loserGoals*10)/10;
	}
	else
	{
		leftGoals = Math.round(loserGoals*10)/10;
		rightGoals = 10;
	}
	
	leftExpectedScore.innerHTML = leftGoals;
	rightExpectedScore.innerHTML = rightGoals;
}
this.dateNowChanged = function()
{
	updateDateSelectorVisibility();
}

function updateDateSelectorVisibility()
{
	datePicker.style.display = dateNowCheckbox.checked ? 'none' : 'inherit';
}

function updateViewNames()
{
	$(".leftAttacker").html(leftPlayer1 ? playersById[leftPlayer1].name : "-offence-");
	$(".leftDefender").html(leftPlayer2 ? playersById[leftPlayer2].name : "-defence-");
	$(".rightAttacker").html(rightPlayer1 ? playersById[rightPlayer1].name : "-offence-");
	$(".rightDefender").html(rightPlayer2 ? playersById[rightPlayer2].name : "-defence-");
}

this.selectPlayer = function(isLeftSide, index)
{
	var title = "";
	if(isLeftSide)
	{
		if(index == 0) title = "Left Offence";
		else title = "Left Defender";
	}
	else
	{
		if(index == 0) title = "Right Offence";
		else title = "Left Defender";
	}
	
	showPlayerSelection(title, function(playerid)
	{
		setPlayerFromOptions(isLeftSide, index, playerid);
		updateViewNames();
		updateRatings();
	});
}

function setPlayerFromOptions(isLeftSide, index, value)
{
	if(isLeftSide)
	{
		if(index == 0) leftPlayer1 = value;
		else leftPlayer2 = value;
	}
	else
	{
		if(index == 0) rightPlayer1 = value;
		else rightPlayer2 = value;
	}
}

function showPlayerSelection(title, callback)
{
	hideActivePlayerSelectDialog();
	var dialogDiv = $(document.createElement('div'));
	activePlayerSelectDialog = dialogDiv;
	
	var dialogClickOutsideHandler = function(e)
	{
		if(dialogDiv.dialog('isOpen')
		&& !jQuery(e.target).is('.ui-dialog, a')
		&& !jQuery(e.target).closest('.ui-dialog').length)
		{
			hideActivePlayerSelectDialog();
		}
	}
	
	// done outside so the 'player' is not static scoped.
	var createButtonCB = function(player)
	{
		return function()
		{
			dialogDiv.dialog("close");
			callback(player.id);
		} 
	}
	
	var buttons = {};
	buttons["-none-"] = function()
	{
		dialogDiv.dialog("close");
		callback(null);
	}
	for (var X in players)
	{
		var player = players[X];
		buttons[player.name] = createButtonCB(player);
	}
	
	dialogDiv.dialog(
	{
		title:title,
		minWidth:480,
		position:['center', 60],
		open: function()
			{
			   jQuery('body').bind('click',	dialogClickOutsideHandler);
			},
		close: function()
			{
			   jQuery('body').unbind('click', dialogClickOutsideHandler);
			},
		buttons:buttons
	});
	$(".ui-dialog-content").hide();	
}

function hideActivePlayerSelectDialog()
{
	if(activePlayerSelectDialog)
	{
		activePlayerSelectDialog.dialog("close");
		activePlayerSelectDialog = null;
	}
}

this.onSubmit = function()
{
	if(FACEBOOK_ENABLED && facebookAccessToken == null)
	{
		FB.login();
		return;
	}
	var request = {};
	request.request = "addMatch";
	request.fbAccessToken = facebookAccessToken;
	request.leftPlayer1 = leftPlayer1;
	request.leftPlayer2 = leftPlayer2;
	request.leftScore = Number(document.getElementById("leftScore").value);
	
	request.rightPlayer1 = rightPlayer1;
	request.rightPlayer2 = rightPlayer2;
	request.rightScore = Number(document.getElementById("rightScore").value);;	
	
	if(!dateNowCheckbox.checked && datePicker.value)
	{
		var date = new Date(datePicker.value);
		request.date = date.getTime();
	}
	if(
		isScoreValid(request.leftScore) 
		&& 
		isScoreValid(request.rightScore) 
		&&
		(request.leftPlayer1 || request.leftPlayer2)
		&&
		(request.rightPlayer1 || request.rightPlayer2)
	)
	{
		if(request.leftScore < 10 && request.rightScore < 10)
		{
			var yes = confirm("Really want to submit an incomplete match?");	
			if(!yes)
			{
				return;
			}
		}
		else if(request.leftScore == request.rightScore)
		{
			var yes = confirm("Really want to submit tied match?");	
			if(!yes)
			{
				return;
			}
		}
		submitButton.disabled = true;
		callAPI(request, onMatchSubmitted);
	}
	else
	{
		alert("invalid input.");
	}
}

function isScoreValid(score)
{
	return score >= 0 && score <= 10;
}

function onMatchSubmitted(body)
{
	if(body.status == "error")
	{
		submitButton.disabled = false;
		alert(body.message);
	}
	else
	{
		submitButton.disabled = false;
		self.onMatchAdded();
	}
}

}