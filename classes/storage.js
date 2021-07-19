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