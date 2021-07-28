const mega = require("megajs");
const fs = require('fs');
const https = require('https');
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

module.exports.directDownload = function(url, destination)
{
	downloads[url] = {
		status: "in progress",
		destination: destination,
		retrieved_bytes: 0,
		cancel: false,
	};

	let sanitsed_url = url.replaceAll(" ", "%20");
		
		https.get(url, (res) => {
			
			try
			{
				let f = fs.createWriteStream(destination);
				
				res.on('end', () => {
					
					if(downloads[url].status !== "cancelled")
					{
						console.log("download complete");
						downloads[url].status = "complete";
					}
				})
				.on('error', (e) => {
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
				.on('data', (chunk) => { 
					downloads[url].retrieved_bytes += chunk.length;
					//console.log(downloads[url].retrieved_bytes);
					
					if(downloads[url].cancel === true)
					{
						downloads[url].status = "cancelled";
						res.destroy();
					}
				})
				.pipe(f);
			}
			catch(e)
			{
				console.log(e);
				downloads[url].error = e;
			}

		}).on('error', (e) => {
			console.error(e);
			console.log(e);
			downloads[url].error = e;
		});
}

module.exports.clearDownload = function(url)
{
	delete downloads[url];
}

module.exports.cancelDownload = function (url)
{		
	downloads[url].cancel = true;
}

module.exports.get_current_downloads = function(url)
{
	return downloads[url];
}

const { create } = require('ipfs-http-client');

var client;

module.exports.initialiseIPFS = function initialiseIPFS(hostname)
{
	client = create(hostname);
}

module.exports.catalogIPFS = async function(hash, type, searchTerm)
{
	return scanIPFS('root', hash, hash, type, searchTerm);
}

async function scanIPFS(name, hash, path, type, searchTerm)
{
	console.log("New recurrsive loop, hash: " + hash);
	
	if(client !== undefined)
	{
		let files = [];
		
		let gen = await client.ls(hash);
		
		while(true)
		{
			let res = await gen.next();
			
			console.log(res);
			
			if(res.done === true)
			{
				break;
			}
			
			if(res.value.type === 'file')
			{
				if((type === "search" && res.value.name.toLowerCase().includes(searchTerm.toLowerCase())) || type === "all")  
				{
					files.push({
						link: "https://ipfs.io/ipfs/" + path + "/" + res.value.name,
						name: res.value.name,
						size: res.value.size,
						cdn: res.value.cid.toString(),
					})
				}
			}
			else if(res.value.type === 'dir')
			{
				files = files.concat(await scanIPFS(res.value.name, res.value.cid.toString(), path + "/" + res.value.name, type, searchTerm));
			}
		}
		
		return files;
	}
	else
	{
		throw "Connection to local IPFS app could not be made.";
	}
}

module.exports.testIpfsDaemon_config = async function(hostname)
{	
	client = create(hostname);
}

module.exports.reconnect_ipfs = async function(hostname)
{	
	client = create(hostname);
}