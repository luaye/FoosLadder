var tableData = [];
var tableName;

var tables = ["orca1_player_data_20160302"];
var raceTableView;
var playersTableView;

function init()
{
	raceTableView = $('#race-table');
	$('#more').hide();
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

function showMore(){
	$('#more').show();
}
function hideTables(){
		raceTableView.hide();
		playersTableView.hide();
		$('#raceContent').hide();
		$('#playerContent').hide();
}

function onViewLeaderboard()
{
	loadTableData($('#leaderboardName').val());
}

function loadTableData(leaderboardName)
{
	hideTables();
	tableName = leaderboardName;
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
	if (activeTable == playersTableView){
		tableData = [];
		for(var i = 0; i < data.length; i++) {
			var blob = JSON.parse(data[i].blob);
			var leaderboardItem = {
					"Name": blob.Name,
					"UID": blob.UID,
					"LastModifiedDate": blob.LastModifiedDate
			};

			var totalLevel = 0;
			for(var j = 0; blob.ClassData != null && j < blob.ClassData.length; j++) {
				var classItem = blob.ClassData[j];
				totalLevel += classItem.Level;
				leaderboardItem[classItem.classId + "Level"] = classItem.Level;
			}
			leaderboardItem["PlayerLevel"] = totalLevel

			tableData = tableData.concat(leaderboardItem);
			var sortKey = "PlayerLevel";
			var sortDir = -1;
			$('#playerContent').show();

		}
	}else{
		tableData = data.concat();
		var sortKey = "raceDate";
		var sortDir = -1;
		$('#raceContent').show();
	}

	var dynatable = activeTable.data('dynatable')
	dynatable.settings.dataset.originalRecords = tableData;
	dynatable.sorts.clear();
	dynatable.sorts.add(sortKey,sortDir);
  	dynatable.process();
  	activeTable.show();
}
