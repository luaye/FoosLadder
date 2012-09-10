var config = require("./config.json");
var SERVER_PORT = config.port;

var apimap = require('./apimap.js');

var sys = require("sys");
var path = require("path");
var url = require("url");
var filesys = require("fs"); 
var http = require("http");
var server = http.createServer(onServerConnection);
server.listen(SERVER_PORT);

console.log("Listening on port "+SERVER_PORT);

function onServerConnection(request, response)
{
	var relativepath = url.parse(request.url).pathname;  
	console.log('onServerConnection: '+relativepath);
	
	if(relativepath.indexOf("api") == 0 || relativepath.indexOf("/api") == 0)
	{
		apimap.runAPI(request, response);
	}
	else
	{
    	serveStaticFile(request, response);
	}
}

function serveStaticFile(request, response)
{
	var relativepath = url.parse(request.url).pathname;
	if(!relativepath || relativepath == "/")
	{
		relativepath = "index.html";
	}
    var fullpath = path.join(process.cwd(), "static", relativepath);
	console.log('serveStaticFile: ' + fullpath );
	
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
                    response.writeHeader(200);  
                    response.write(file, "binary");  
                    response.end();  
                }  
  
            });  
        }  
    })
}