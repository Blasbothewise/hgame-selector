const mega = require("megajs");
const fs = require('fs');
const storage = require("./storage.js");

module.exports.validateMegaFolderUrl = function(url)
{
	return new Promise((resolve, reject) => {
		if(url.includes("/file/"))
		{
			reject("Mega url cannot be mega file");
		}
		else
		{
			try
			{
				let dir = mega.File.fromURL(url);
				resolve();
			}
			catch(e)
			{
				reject(e);
			}
		}
	});
}

module.exports.megaCatalog = function (url, type, searchTerm)
{
	return new Promise((resolve, reject) => {
		let dir = mega.File.fromURL(url);
		
		dir.loadAttributes(function(error, data){
			if(error)
			{
				console.log(error);
				reject(error);
			}
			else
			{
				let files = analyseMegaFolder(data, url, type, searchTerm);
				resolve(files);
			}
		});
	});
}

function analyseMegaFolder(folder, url, type, searchTerm)
{
	let directories = [];
	let files = [];
	
	for(let i = 0; i < folder.children.length; i++)
	{
		if(folder.children[i].directory === true)
		{
			files = files.concat(analyseMegaFolder(folder.children[i], url, type, searchTerm));
			
		}
		else
		{
			switch(type)
			{
				case "all":
					files.push({
						name: folder.children[i].name,
						link: url + "/file/" + folder.children[i].downloadId[1],
						size: folder.children[i].size, //size in bytes
					});
				break;
				
				case "search":
				
					if(folder.children[i].name.toLowerCase().includes(searchTerm.toLowerCase()))
					{
						files.push({
							name: folder.children[i].name,
							link: url + "/file/" + folder.children[i].downloadId[1],
							size: folder.children[i].size, //size in bytes
						});
					}
				
				break;
			}
		}
	}
	
	return files;
}

var downloads = {};

module.exports.megaDownload = function(url, destination)
{	
	let file = mega.File.fromURL(url);
	
	file.loadAttributes(function(error, f){
		if(error)
		{
			console.log(error);
		}
		else
		{
			downloads[url] = {};
			downloads[url].status = "in progress";
			downloads[url].destination = destination;
			downloads[url].retrieved_bytes = 0;
			downloads[url].cancel = false;
			downloads[url].data = [];
			
			//downloads[url].stream = fs.createWriteStream(destination);
			
			try
			{
				let d = f.download()
				.on('close', () => {
					console.log('mega download complete');
					downloads[url].status = "complete";
				})
				.on('error', (err) => {
					console.error(err);
					if(downloads[url].status === "cancelled")
					{
						
					}
					else
					{
						downloads[url].error = err;
						downloads[url].status = "failed";
					}

				})
				.on('data', (data) => {
					downloads[url].retrieved_bytes += data.length;
					//console.log(downloads[url].retrieved_bytes);
					//downloads[url].data.push(data);
					
					if(downloads[url].cancel === true)
					{
						downloads[url].status = "cancelled";
						d.end();
					}
				})
				.pipe(fs.createWriteStream(destination));
			}
			catch(e)
			{
				console.log(e);
				downloads[url].error = e;
			}
		}
	});
}

module.exports.cancelDownload = function (url)
{		
	downloads[url].cancel = true;
}

module.exports.get_current_downloads = function(url)
{
	return downloads[url];
}

module.exports.testIPFS = async function()
{
	console.log("IPFS test start");
	
	const ipfsclient = require("ipfs-http-client")
	
	const ipfs = new ipfsclient({host: 'localhost', port: '5001', protocol: 'http'});

	const file = await ipfs.add(urlSource('https://ipfs.io/ipns/k2k4r8l7mxpi57sotykoy5f5ucakg0dr0ib0avmyjhwmofkvpfhfd510/bin.html'));

	console.log(file);
}