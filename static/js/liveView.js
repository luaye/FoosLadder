function LiveView(view)
{
	var playersById;
	
this.show = function()
{
	view.show();
}

this.hide = function()
{
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

}