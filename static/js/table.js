function LoadableTable (tableElement)
{
	var rows = [];
	var loadingElement = $(tableElement).find("#loadingRow")[0];
	var rowSample = $(tableElement).find("#sampleRow")[0];
	
	tableElement.removeChild(rowSample);

	this.clear = function()
	{
		for(var X in rows)
		{
			var row = rows[X];
			tableElement.removeChild(row);
		}
		rows = [];
	}

	
	this.setLoading = function (value)
	{
		if(loadingElement)
		{
			if(value)
			{
				loadingElement.style.display = null;
			}
			else
			{
				loadingElement.style.display = 'none';
			}
		}
	}

	this.createRow = function()
	{
		var row = rowSample.cloneNode(true);
		rows.push(row);
		tableElement.appendChild(row);
		return row;
	}
}