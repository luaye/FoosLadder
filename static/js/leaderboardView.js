var tableData = [];
var tableName;

var tables = ["orca1_race_data_20160302"];
var raceTableView;
var playersTableView;

function init()
{
	raceTableView = $('#race-table');
	playersTableView = $('#players-table');
	hideTables();
	$('#leaderboardName').val(tables[0]);
	$('#race-table').dynatable({
			dataset: {
				records: tableData
			},
			features: {
			  paginate: false,
			  recordCount: false,
			  search: false
			}
	});

	$('#players-table').dynatable({
			dataset: {
				records: tableData
			},
			features: {
			  paginate: false,
			  recordCount: false,
			  search: false
			}
	});
}

function hideTables(){
		raceTableView.hide();
		playersTableView.hide();
}

function onViewLeaderboard()
{
	hideTables();
	loadTableData();
}
function loadTableData()
{
	tableName = $('#leaderboardName').val();
	tableData = [];

	if (tableName.indexOf("race_data") > 0){
		activeTable = raceTableView;
	}else{
		activeTable = playersTableView;
	}

	var request = {request:"leaderboard",
			table:tableName
	};

	callAPI(request, onTableLoaded);
}

function onTableLoaded(data)
{
	tableData = data.concat();

	var dynatable = activeTable.data('dynatable')
	dynatable.settings.dataset.originalRecords = tableData;
  	dynatable.process();
  	activeTable.show();
}
