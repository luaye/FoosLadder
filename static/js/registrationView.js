function RegistrationView(loadableTable)
{

var registrations;
var companies;
var table = loadableTable;
var self = this;

var sortKey = "stats.avg.rating";
var sortReversed;

var shouldShowAllRegistrations = false;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.element.show();
	if(registrations == null)
	{
		self.loadRegistrations();
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

this.loadRegistrations = function()
{
	callAPI({request:"getRegistrations"}, onRegistrationsLoaded);
}

this.setRegistrations = function(data)
{
	onRegistrationsLoaded(data)
}

this.setCompanies = function(data)
{
	onCompaniesLoaded(data)
}

this.showAllRegistrations = function()
{
	$(".showAllRegistrations").hide();
	shouldShowAllPlayers = true;
	updateRows();
}

this.updateRows = function()
{
	table.clear();
	table.setLoading(true);
}

function onRegistrationsLoaded(data)
{
	registrations = data.concat();
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

	var filteredRegistrations = [];
	for(X in registrations)
	{
		var registration = registrations[X];
		if(shouldShowAllRegistrations || !registration.inactive)
		{
			filteredRegistrations.push(registration);
		}
	}

	if(filteredRegistrations.length == 0) filteredRegistrations = registrations;

	for(X in filteredRegistrations)
	{
		registrationRow = table.createRow();
		fillRowWithRegistration(registrationRow, filteredRegistrations[X]);
	}
}

function fillRowWithRegistration(tableRow, registration)
{
	var activateLink = "<a href='javascript:activateRegistration(\""+registration.id+"\")'>Activate</a>";
	if (registration.activated)
		activateLink = "";

	var company = registration.company;
	if (company == null)
		company = "";
	else company = GetCompanyNameById(registration.company);

	var row = $(tableRow);
	setContentsOfTag(tableRow, "playerName", registration.name);
	setContentsOfTag(tableRow, "playerCompany", company);
	setContentsOfTag(tableRow, "playerEmail", registration.email);
	setContentsOfTag(tableRow, "playerAdded", registration.added);
	setContentsOfTag(tableRow, "playerRecentGameCount", registration.recentGameCount);
	setContentsOfTag(tableRow, "playerActivation", activateLink);
}

function GetCompanyNameById(id)
{
	return FindNameById(companies, id);
}

function GetCompanyIdByName(name)
{
	if(companies)
	{
		for(var X in companies)
		{
			if(companies[X].name == name) return companies[X].id;
		}
	}
	return "";
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

this.addRegistration = function()
{
	if(registrations == null)
	{
		alert("Registrations loading in progress.");
		return;
	}

	addRegistration();
}


function addRegistration()
{
	var dialog = $('#addRegistrationModal');
	var options = $("#addRegistrationCompany");
	$.each(companies, function() {
	    options.append($("<option />").val(this.name).text(this.name));
	});
	dialog.modal('show');
}

this.onRegistrationSubmit = function()
{
	var name = $("#addRegistrationName").val();
	var company = $("#addRegistrationCompany").val();
	var email = $("#addRegistrationEmail").val();
	var recentGameCount = $("#addRecentGameCount").val();

	if(company)
	{
		company = GetCompanyIdByName(company);
	}

	var request = {request:"addRegistration",
		name:name,
		company:company,
		email:email,
		recentGameCount:recentGameCount
	};

	callAPI(request, onRegistrationAdded);
}

function resetAddRegistration()
{
	$("#addRegistrationName").val("");
	$("#addRegistrationCompany").val("");
	$("#addRegistrationEmail").val("");
	$("#addRecentGameCount").val("");
}

function onRegistrationAdded(response)
{
	if(response.status == "error")
	{
		alert(response.message ? response.message : "Error adding registration.")
	}
	else
	{
		resetAddRegistration();
		var dialog = $('#addRegistrationModal');
		dialog.modal('hide');
		self.loadRegistrations();
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
	registrations.sort(function(a, b)
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


}
