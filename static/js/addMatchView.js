
function AddMatchView(tableElement)
{

var table = tableElement;

var leftPlayer1Field = document.getElementById("leftPlayer1");
var leftPlayer2Field = document.getElementById("leftPlayer2");
var rightPlayer1Field = document.getElementById("rightPlayer1");
var rightPlayer2Field = document.getElementById("rightPlayer2");
var dateNowCheckbox = document.getElementById("dateNow");
var datePicker = document.getElementById("datePicker");
var submitButton = document.getElementById("submit");

$('#datePicker').datetimepicker();
updateDateSelectorVisibility();

this.loadPlayers = function()
{
	callAPI({request:"getPlayers"}, onPlayersLoaded);
}

this.setPlayers = function(data)
{
	onPlayersLoaded(data)
}

function onPlayersLoaded(data)
{
	fillSelectListWithPlayers(leftPlayer1Field, data, "-- attacker --");
	
	fillSelectListWithPlayers(leftPlayer2Field, data, "-- defender --");
	
	fillSelectListWithPlayers(rightPlayer1Field, data, "-- attacker --");
	
	fillSelectListWithPlayers(rightPlayer2Field, data, "-- defender --");
}

function fillSelectListWithPlayers(selectElement, players, blankname)
{
	selectElement.options.length = 0;
	selectElement.options.add(new Option(blankname, ""));
	for (var X in players)
	{
		var player = players[X];
		selectElement.options.add(new Option(player.name, player.id));
	}
}

this.dateNowChanged = function()
{
	updateDateSelectorVisibility();
}

function updateDateSelectorVisibility()
{
	datePicker.style.display = dateNowCheckbox.checked ? 'none' : 'inherit';
}

this.onSubmit = function()
{
	var request = {};
	request.request = "addMatch";
	request.leftPlayer1 = String(leftPlayer1Field.value);
	request.leftPlayer2 = String(leftPlayer2Field.value);
	request.leftScore = Number(document.getElementById("leftScore").value);
	
	request.rightPlayer1 = String(rightPlayer1Field.value);
	request.rightPlayer2 = String(rightPlayer2Field.value);
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
		window.location = "matches.html";
	}
}

}