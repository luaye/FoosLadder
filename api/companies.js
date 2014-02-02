var users = require("./users.js");

exports.getCompanies = function(body, callback)
{
	GLOBAL.companiesDB.view('companies', 'by_name',
	function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("companies.getCompanies error: "+error);
			callback([]);
		}
		else
		{
			var result = [];
			for (var X in body.rows)
			{
				var company = body.rows[X].value;
				company.id = company._id;
				delete company._id;
				delete company._rev;
				result.push(company);
			}
			//console.log("users.getUsers OK: " + JSON.stringify(result));
			callback(result);
		}
	});
}


exports.addCompany = function(body, callback)
{
	console.log("companies.addCompany: ",body);

	users.isAsscessTokenValidForAdding(body.fbAccessToken, function(ok) {
		if(ok)
		{
			addCompanyToDB(body, callback);
		}
		else
		{
			console.log("addCompany: "+ body.name +" NOT AUTHORIZED");
			callback({status:"error", message:"Not authorized."});
		}
	});
}



function addCompanyToDB(body, callback)
{
	if(!body.name)
	{
		callback({status:"error", message:"Invalid name"});
		return;
	}
	var company = {name: body.name};



	GLOBAL.companiesDB.insert(company, null, function (error, body, headers)
	{
		if(error || !body)
		{
			console.log("companies.addCompany error: "+error);
			callback({status:"error", message:error.message});
		}
		else
		{
			console.log("companies.addCompany OK: " + JSON.stringify(body));
			callback({status:"ok"});
		}
	});
}


