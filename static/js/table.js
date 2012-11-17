function LoadableTable (tableElement)
{
	this.element = $(tableElement);
	
	var rows = [];
	var loadingElement = this.element.find("#loadingRow")[0];
	var rowSample = this.element.find("#sampleRow")[0];
	
	var container = rowSample.parentNode;
	var elementAfterSampleRow = rowSample.nextSibling;
	
	container.removeChild(rowSample);

	this.table = tableElement;
	
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
		if(elementAfterSampleRow)
		{
			container.insertBefore(row, elementAfterSampleRow);
		}
		else
		{
			container.appendChild(row);
		}
		return row;
	}
}