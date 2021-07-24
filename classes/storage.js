const fs = require('fs');

/*
##############################
# File manangement #
##############################
*/

module.exports.moveFile = function (source, destination)
{
	return new Promise((resolve, reject) => {			
		fs.rename(source, destination, function(err){
			if(err)
			{
				reject(err);
			}
			else
			{				
				resolve(destination);
			}
		});
	});
}

module.exports.copyFile = function(source, destination)
{
	return new Promise((resolve, reject) => {			
		fs.copyFile(source, destination, function(err){
			if(err)
			{
				reject(err);
			}
			else
			{
				resolve(destination);
			}
		});
	});
}

const https = require('https');
var Stream = require('stream').Transform;

module.exports.download_file = function(url, destination)
{
	return new Promise((resolve, reject) => {			
		
		let filename = url.split('/').pop();
		
		https.get(url, (res) => {

			let rawData = new Stream();
			
			res.on('data', (chunk) => { rawData.push(chunk); });
			
			res.on('end', () => {
				fs.writeFileSync(destination + filename, rawData.read()); 
				resolve(destination + filename);
			});

		}).on('error', (e) => {
			reject(error)
		});
	});
}

var downloads = {};

module.exports.download_file_background = function(url, destination)
{
	return new Promise((resolve, reject) => {			
		
		downloads[url].status = "in progress";
		downloads[url].destination = destination;
		
		let filename = url.split('/').pop();
		
		https.get(url, (res) => {

			let rawData = new Stream();
			
			res.on('data', (chunk) => { 
				downloads[url].size += chunk.length;
				rawData.push(chunk);
			});
			
			res.on('end', () => {
				fs.writeFileSync(destination + filename, rawData.read());
				downloads[url].status = "complete";
			});

		}).on('error', (e) => {
			downloads[url].status = "failed";
		});
	});
	
	resolve(downloads[url]);
}

module.exports.get_current_downloads = function(url)
{
	return downloads[url];
}

module.exports.delete_files = function delete_files(files){
	return delete_file(files, 0);
}

function delete_file(files, index)
{
	return new Promise((resolve, reject) => {
		
		if(files.length > 0)
		{
			fs.unlink(files[index], function(err)
			{
				if(err)
				{
					reject(err)
				}
				else
				{
					if(index < files.length - 1)
					{
						delete_file(files, index + 1)
						.then(function(result)
						{
							resolve();
						})
						.catch(function(error)
						{
							reject(error)
						});
					}
					else
					{
						resolve();
					}
				}
			});
		}
		else
		{
			resolve();
		}
	});
}

const scraper_importer = require('./scraper_importer.js');

module.exports.scanForExecutable = scanForExecutable;

function scanForExecutable(directory)
{
	return new Promise((resolve, reject) => {
		
		//console.log("recursion");
		
		fs.readdir(directory, function(err, files){
			if(err)
			{
				reject(err);
			}
			else
			{
				if(files.length === 0)
				{
					resolve(null);
				}
				else
				{
					let applications = [];
					let exes = [];
					let directories = [];
					
					for(let i = 0; i < files.length; i++)
					{
						if(files[i].split(".").pop() === "exe") //Add other executables here
						{
							exes.push(files[i]);
						}
						else if(fs.lstatSync(directory + "/" + files[i]).isDirectory())
						{
							directories.push(files[i]);
						}
					}
					
					let dlsite_code = scraper_importer.getDLsiteFromDirName(directory.split("/").pop());
					
					if(exes.length > 0)
					{
						applications.push({
							dir_name: directory,
							exes: exes
						});
						
						resolve(applications);
					}
					else if(exes.length === 0 && dlsite_code !== undefined && directories.length > 0) //if dlsite code is found within 
					{	
						let application = {
							exe_in_child: true,
							dlsite_url: dlsite_code,
							paths: []
						};
						
						let promises = []
					
						for(let i = 0; i < directories.length; i++)
						{
							promises.push(scanForExecutable(directory + "/" + directories[i]));
						}
						
						Promise.all(promises)
						.then(function(results){
							for(let i = 0; i < results.length; i++)
							{
								if(results[i] !== null)
								{
									application.paths.push(results[i]);
								}
							}
							
							applications.push(application);
							
							if(applications.length === 0 || application.paths.length === 0)
							{
								resolve(null);
							}
							else
							{
								resolve(applications);
							}
						})
						.catch(function(error){
							reject(error)
						});
					}
					else if(exes.length === 0 && directories.length > 0)
					{
						let promises = [];
						
						for(let i = 0; i < directories.length; i++)
						{
							promises.push(scanForExecutable(directory + "/" + directories[i]));
						}
						
						Promise.all(promises)
						.then(function(results){
							for(let i = 0; i < results.length; i++)
							{
								if(results[i] !== null)
								{
									applications = applications.concat(results[i]);
								}
							}
							
							if(applications.length === 0)
							{
								resolve(null);
							}
							else
							{
								resolve(applications);
							}
						})
						.catch(function(error){
							reject(error)
						})
					}
					else
					{
						resolve(null);
					}
				}
			}
		});
	});
}