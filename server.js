var config = require("./config.json");

var apimap = require('./apimap.js');

var sys = require("sys");
var path = require("path");
var url = require("url");
var filesys = require("fs"); 
var http = require("http");
var server = http.createServer(onServerConnection);
server.listen(config.port);
console.log("Listening on port "+config.port);

if (process.argv.length > 2) {
	if (process.argv[2] == 'contest') {
		runAlgorithmContest();
	}
}

function runAlgorithmContest()
{
	console.log("Running contest");
	var contest = require('./contest.js');
	console.log("Waiting for DBs...");
	
	apimap.afterReady(function() {
		contest.run();
	});
}

function onServerConnection(request, response)
{
	var relativepath = url.parse(request.url).pathname;  
	//console.log('onServerConnection: '+relativepath);
	
	if(relativepath.indexOf("api") == 0 || relativepath.indexOf("/api") == 0)
	{
		apimap.runAPI(request, response);
	}
	else
	{
    	serveStaticFile(request, response);
	}
}

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};

function serveStaticFile(request, response)
{
	var relativepath = url.parse(request.url).pathname;
	if(!relativepath || relativepath == "/")
	{
		relativepath = "index.html";
	}
	if(relativepath.charAt(relativepath.length -1) == "/")
	{
		relativepath += "index.html";
	}
    var fullpath = path.join(process.cwd(), "static", relativepath);
	//console.log('serveStaticFile: ' + fullpath );
	
	filesys.exists(fullpath,function(exists)
	{  
        if(!exists){  
            response.writeHeader(404, {"Content-Type": "text/plain"});  
            response.write("404 Not Found\n"+ relativepath +"\n");  
            response.end();  
        }  
        else{  
            filesys.readFile(fullpath, "binary", function(err, file) {  
                 if(err) {  
                     response.writeHeader(500, {"Content-Type": "text/plain"});  
                     response.write("ERROR: "+err + "\n");  
                     response.end();
                 }  
                 else{
					var mimeType = null;
					var extIndex = fullpath.lastIndexOf(".");
					if(extIndex >= 0)
					{
						var ext = fullpath.substring(extIndex + 1, fullpath.length);
						mimeType = mimeTypes[ext];
					}
					
					if(mimeType)
					{
                   		response.writeHeader(200, {'Content-Type':mimeType});  
					}
					else
					{
                    	response.writeHeader(200);  
					}
                    response.write(file, "binary");  
                    response.end();  
                }  
  
            });  
        }  
    })
}
