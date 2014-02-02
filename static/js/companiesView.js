function CompaniesView(loadableTable)
{

var companies;
var table = loadableTable;
var self = this;

var sortKey = "name";
var sortReversed;
var commentsInitialised;
var shouldShowAllCompanies = false;

table.clear();
table.setLoading(true);

this.show = function()
{
	table.element.show();
	if(companies == null)
	{
		self.loadCompanies();
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

this.loadCompanies = function()
{
	callAPI({request:"getCompanies"}, onCompaniesLoaded);
}

this.setCompanies = function(data)
{
	onCompaniesLoaded(data)
}

this.showAllCompanies = function()
{
	$(".showAllCompanies").hide();
	shouldShowAllCompanies = true;
	updateRows();
}

this.updateRows = function()
{
	table.clear();
	table.setLoading(true);
}

function onCompaniesLoaded(data)
{
	companies = data.concat();
	updateSort();
}

function updateRows()
{
	table.setLoading(false);
	table.clear();

	var X;
	var companyRow;
	for(X in companies)
	{
		var company = companies[X];
		if(shouldShowAllCompanies || !company.inactive)
		{
			companyRow = table.createRow();
			fillRowWithCompany(companyRow, company);
		}
	}
}

function fillRowWithCompany(tableRow, company)
{
	setContentsOfTag(tableRow, "companyName", company.name);
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

this.addCompany = function()
{
	if(companies == null)
	{
		alert("Company loading in progress.");
		return;
	}

	ensureAuthorisedAndCall(addCompanyAfterAuth);
}

function addCompanyAfterAuth()
{
	var dialog = $('#addCompanyModal');
	dialog.modal('show');
}

this.onAddSubmit = function()
{
	var name = $("#addCompanyName").val();

	var request = {request:"addCompany",
		name:name,
		fbAccessToken:facebookAccessToken
	};

	callAPI(request, onCompanyAdded);
}

function resetAddCompany()
{
	$("#addCompanyName").val("");
}

function onCompanyAdded(response)
{
	if(response.status == "error")
	{
		alert(response.message ? response.message : "Error adding company.")
	}
	else
	{
		resetAddCompany();
		var dialog = $('#addCompanyModal');
		dialog.modal('hide');
		self.loadCompanies();
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
	companies.sort(function(a, b)
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
