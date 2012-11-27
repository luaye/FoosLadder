
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
var datePicker = $("#datePicker");
var submitButton = document.getElementById("submit");

updateDateSelectorVisibility();

this.show = function()
{
	table.style.display = null;
	if(players == null)
	{
		self.loadPlayers();
	}
}

this.hide = function()
{
	table.style.display  = 'none';
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


function updateRatings()
{
	resetExpectedScore();
	var request = {};
	request.request = "getExpectedScores";
	request.leftPlayer1 = leftPlayer1;
	request.leftPlayer2 = leftPlayer2;
	request.rightPlayer1 = rightPlayer1;
	request.rightPlayer2 = rightPlayer2;
	callAPI(request, function(result)
	{
		$(".leftExpectedScore").text(isNaN(result.leftScore) ? "?" : scoreRound(result.leftScore));
		$(".rightExpectedScore").text(isNaN(result.rightScore) ? "?" : scoreRound(result.rightScore));
	});
}

function scoreRound(num)
{
	return Math.round(num*10)/10;
}

function resetExpectedScore()
{
	$(".leftExpectedScore").text("?");
	$(".rightExpectedScore").text("?");
}

this.dateNowChanged = function()
{
	updateDateSelectorVisibility();
}

function updateDateSelectorVisibility()
{
	if(dateNowCheckbox.checked) datePicker.hide();
	else 
	{
		setupDatePicker(datePicker);
		datePicker.show();
	}
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
	var currentPlayer = null;
	if(isLeftSide)
	{
		if(index == 0) 
		{
			title = "Left Offence";
			currentPlayer = leftPlayer1;
		}
		else 
		{
			title = "Left Defence";
			currentPlayer = leftPlayer2;
		}
	}
	else
	{
		if(index == 0) 
		{
			title = "Right Offence";
			currentPlayer = rightPlayer1;
		}
		else 
		{
			title = "Right Defence";
			currentPlayer = rightPlayer2;
		}
	}
	
	var playersList = players.concat();
	playersList.unshift(null);
	
	hideActivePlayerSelectDialog();
	var options = {};
	
	options.currentPlayer = currentPlayer ? playersById[currentPlayer] : null;
	
	var inactivePlayers = options.inactivePlayers = [];
	if(leftPlayer1) inactivePlayers.push(playersById[leftPlayer1]);
	if(leftPlayer2) inactivePlayers.push(playersById[leftPlayer2]);
	if(rightPlayer1) inactivePlayers.push(playersById[rightPlayer1]);
	if(rightPlayer2) inactivePlayers.push(playersById[rightPlayer2]);
	
	showPlayerSelectionDialog(function(dialog, player)
	{
		dialog.modal('hide');
		setPlayerFromOptions(isLeftSide, index, player ? player.id : null);
		updateViewNames();
		updateRatings();
	}, title, playersList, options);
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

this.onSubmit = function()
{
	ensureAuthorisedAndCall(submitMatch);
}

function submitMatch()
{
	var request = {};
	request.request = "addMatch";
	request.fbAccessToken = facebookAccessToken;
	request.leftPlayer1 = leftPlayer1;
	request.leftPlayer2 = leftPlayer2;
	request.leftScore = Number(document.getElementById("leftScore").value);
	
	request.rightPlayer1 = rightPlayer1;
	request.rightPlayer2 = rightPlayer2;
	request.rightScore = Number(document.getElementById("rightScore").value);;	
	
	if(!dateNowCheckbox.checked)
	{
		var date = getDatePickerDate(datePicker);
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
		self.reset();
		self.onMatchAdded();
	}
}

this.reset = function()
{
	
	document.getElementById("leftScore").value = "10";
	document.getElementById("rightScore").value = "10";
	leftPlayer1 = null;
	leftPlayer2 = null;
	rightPlayer1 = null;
	rightPlayer2 = null;
	dateNowCheckbox.checked = true;
	updateDateSelectorVisibility();
	resetExpectedScore();
	updateViewNames();
	submitButton.disabled = false;
}

}