const mega = require("megajs");

module.exports.megaCatalog(url)
{
	let dir = mega.File.fomURL(url);
	
	dir.loadAttributes(function(error, data){
		let files = analyseMegaFolder(data, url);
	});
}

function analyseMegaFolder(folder, url)
{
	let directories = [];
	let files = [];
	
	for(let i = 0; i < data.children.length; i++)
	{
		if(data.children[i].directory === true)
		{
			files = files.concat(analyseMegaFolder(data.children[i]));
		}
		else
		{
			files.push({
				name: data.children[i].name,
				link: url + "/file/" + data.children[i].downloadId[1],
				size: data.children[i].size, //size in bytes
			);
		}
	}
	
	return files;
}