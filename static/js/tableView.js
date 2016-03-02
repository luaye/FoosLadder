var tableData;
var tableName;

function loadTableData()
{
	tableName = "orca1_race_data_20160302";
	tableData = [];

	var request = {request:"leaderboard",
			table:tableName
	};

	callAPI(request, onTableLoaded);
}

function onTableLoaded(data)
{
	tableData = data.concat();

	$('#my-table').dynatable({
		dataset: {
			records: tableData
		},
		features: {
		  paginate: false,
		  search: false
		}
	});

	var dynatable = $('#my-table').data('dynatable');

}
