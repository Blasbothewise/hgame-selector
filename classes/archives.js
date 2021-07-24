const mega = require("megajs");
const fs = require('fs');

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
			files = files.concat(analyseMegaFolder(folder.children[i]));
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
			}
		}
	}
	
	return files;
}

var megaDownloads = {};

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
			megaDownloads[url] = {};
			megaDownloads[url].status = "in progress";
			megaDownloads[url].destination = destination;
			megaDownloads[url].retrieved_bytes = 0;
			
			f.download()
			.on('close', () => {
				console.log('mega download complete');
				megaDownloads[url].status = "complete";
			})
			.on('error', (err) => {
				console.error(err);
			})
			.on('data', (data) => {
				megaDownloads[url].retrieved_bytes += data.length;
				console.log(megaDownloads[url].retrieved_bytes);
			})
			.pipe(fs.createWriteStream(destination));
		}
	});
}

module.exports.get_current_downloads = function(url)
{
	return megaDownloads[url];
}