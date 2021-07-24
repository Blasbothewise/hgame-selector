const { app, BrowserWindow, screen, ipcMain, dialog, shell} = require('electron')
const json = require("electron-json-storage");
require('dotenv').config();
const scraper_importer = require('./classes/scraper_importer.js');
const storage = require('./classes/storage.js');
const validator = require("validator");
const child = require('child_process').execFile;
const fs = require('fs');
const archives = require('./classes/archives.js');

var win;

function createWindow () {
	win = new BrowserWindow({
		width: screen.getPrimaryDisplay().size.width / 1.5,
		height: screen.getPrimaryDisplay().size.height / 1.5,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false, //enable require calls from web to electron
			enableRemoteModule: true //enable remote for function calls from web to electron
		},
		icon: __dirname + '/assets/laplace.ico',
		show: false //Initially hide window
	});

	win.loadFile('index.html');
	win.once('ready-to-show', function(){
		win.show();
	});
}

var collection, catalog, config;

function initialiseApp()
{
	console.log(__dirname);
	
	if(!fs.existsSync(__dirname + "/temporary_files"))
	{
		fs.mkdirSync(__dirname + "/temporary_files");
	}
	
	if(!fs.existsSync(__dirname + "/downloads"))
	{
		fs.mkdirSync(__dirname + "/downloads");
	}
	
	if(!fs.existsSync(__dirname + "/userdata"))
	{
		fs.mkdirSync(__dirname + "/userdata");
	}
	
	if(!fs.existsSync(__dirname + "/userdata/icons"))
	{
		fs.mkdirSync(__dirname + "/userdata/icons");
	}
	
	json.setDataPath(app.getAppPath() + "\\userdata");
	console.log(json.getDataPath());
	
	loadJSON_Batch(["collection.json", "config.json", "catalog.json"])
	.then(function(result){
		
		collection = result.collection.json;
		
		if(collection.circles === undefined)
		{
			collection.circles = [];
		}
		
		catalog = result.catalog.json;
		
		if(catalog.mega === undefined)
		{
			catalog.mega = {};
		}
		
		if(catalog.mega.archives == undefined)
		{
			catalog.mega.archives = [{
				name: "/mggg/",
				url: "https://mega.nz/folder/pIplwJjb#Mh1pg3KiddYb9X3GEByjuQ"
			}];
		}
		
		if(catalog.ipfs === undefined)
		{
			catalog.ipfs = {};
		}
		
		if(catalog.ipfs.archives == undefined)
		{
			catalog.ipfs.archives = [];
		}
		
		config = result.config.json;
		
		saveJSON("catalog.json", catalog);
	})
	.catch(function(error){
		console.log(error);
	});
	
	initialiseComms();
}

initialiseApp();

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function initialiseComms()
{
	ipcMain.on('scrape_dlsite', (event, args) => {
		scraper_importer.scrapeDLsite(args)
		.then(function(result){
			console.log(result);
			event.reply('scrape_dlsite_res', {status: "success", data: result});
		})
		.catch(function(error){
			console.log(error);
			event.reply('scrape_dlsite_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('import_VNDB', (event, args) => {		
		scraper_importer.importVNDB(args)
		.then(function(result){
			event.reply('import_vndb_res', {status: "success", data: result.items[0]});
		})
		.catch(function(error){
			console.log(error);
			event.reply('import_vndb_res', {status: "error", message: error});
		})
	});
	
	ipcMain.on('addHgame', (event, args) => {
		addHgame(args)
		.then(function(result){
			event.reply('addHgame_res', {status: "success", data: result});
		})
		.catch(function(error){
			console.log(error);
			event.reply('addHgame_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('removeHgame', (event, args) => {
		removeHgame(args.circle_index, args.hgame_index)
		.then(function(result){
			event.reply('removeHgame_res', {status: "success", data: result});
		})
		.catch(function(error){
			console.log(error);
			event.reply('removeHgame_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('editHgame', (event, args) => {
		editHgame(args)
		.then(function(result){
			event.reply('editHgame_res', {status: "success", data: result});
		})
		.catch(function(error){
			console.log(error);
			event.reply('editHgame_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('getCollection', (event, args) => {
		event.reply('getCollection_res', {status: "success", data: collection});
	});
	
	ipcMain.on('searchCollection', (event, args) => {
		event.reply('searchCollection_res', {status: "success", data: searchCollection(args.searchTerm)})
	});
	
	ipcMain.on('executeEXE', (event, args) => {
		child(args, function(err, data){
			if(err)
			{
				console.log(err);
				event.reply('executeEXE_res', {status: "error", message: err});
			}
			else
			{
				event.reply('executeEXE_res', {status: "success"});
			}
		});
	});
	
	ipcMain.on('scanForHgames', (event, args) => {
		scanForHgames(args)
		.then(function(result)
		{
			event.reply('scanForHgames_res', {status: "success", data: result});
		})
		.catch(function(error)
		{
			event.reply('scanForHgames_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('getFolderPath', (event, args) => {
		dialog.showOpenDialog(win, {properties: ['openDirectory']})
		.then(function(result)
		{
			event.reply('getFolderPath_res', {status: "success", data: result.filePaths[0]});
		})
		.catch(function(error)
		{
			event.reply('getFolderPath_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('getFilePath', (event, args) => {
		
		console.log(args);
		
		dialog.showOpenDialog(win, {properties: []})
		.then(function(result)
		{
			console.log(result);
			event.reply('getFilePath_res', {status: "success", data: result.filePaths[0]});
		})
		.catch(function(error)
		{
			event.reply('getFilePath_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('batchAddHgames', (event, args) => {
		addHgameBatch(args)
		.then(function(result)
		{
			event.reply('batchAddHgames_res', {status: "success", data: result});
		})
		.catch(function(error)
		{
			event.reply('batchAddHgames_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('addMegaArchive', (event, args) => {
		addMegaArchive(args.url, args.name)
		.then(function(result)
		{
			event.reply('addMegaArchive_res', {status: "success", data: result});
		})
		.catch(function(error)
		{
			event.reply('addMegaArchive_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('getCatalog', (event, args) => {
		event.reply('getCatalog_res', {status: "success", data: catalog});
	});
	
	ipcMain.on('searchMegaArchive', (event, args) => {
		searchMegaArchive(args.url, args.type, args.searchTerm)
		.then(function(result)
		{
			event.reply('searchMegaArchive_res', {status: "success", data: result, container: args.container});
		})
		.catch(function(error)
		{
			event.reply('searchMegaArchive_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('downloadHgame_mega', (event, args) => {
		downloadHgame_mega(args.url, args.filename, args.type, args.retry)
		.then(function(result)
		{
			event.reply('downloadHgame_mega_res', {status: "success", data: result});
		})
		.catch(function(error)
		{
			event.reply('downloadHgame_mega_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('get_download_progress_mega', (event, args) => {
		
		console.log(args);
		
		let download = archives.get_current_downloads(args);
		
		if(download !== undefined)
		{
			event.reply('get_download_progress_mega_res', {status: "success", data: download, url: args});
		}
		else
		{
			event.reply('get_download_progress_mega_res', {status: "error", message: "Download does not exist", url: args});
		}
	});
	
	ipcMain.on('openPath', (event, args) => {
		openPath(args.path, args.relative, args.file);
	});
	
	ipcMain.on('cancelDownload', (event, args) => {
		
		archives.cancelDownload(args);
		
		event.reply('cancelDownload_res', {status: "success", data: args});
	});
	
	scraper_importer.loginVNDB_basic()
	.then(function(result){
		console.log(result);
	})
	.catch(function(error){
		console.log(error);
	});
	
	//archives.testIPFS();
}

function hgameExists(val, varName)
{
	for(let i = 0; i < collection.circles.length; i++)
	{
		for(let i2 = 0; i2 < collection.circles[i].hgames.length; i2++)
		{
			if(collection.circles[i].hgames[i2][varName] === val)
			{
				return true;
			}
		}
	}
	
	return false;
}

function hgameExists_notAtIndex(val, varName, circle_index, hgame_index)
{
	circle_index = parseInt(circle_index);
	hgame_index = parseInt(hgame_index);
	
	for(let i = 0; i < collection.circles.length; i++)
	{
		for(let i2 = 0; i2 < collection.circles[i].hgames.length; i2++)
		{
			if(collection.circles[i].hgames[i2][varName] === val && i === circle_index && i2 !== hgame_index || collection.circles[i].hgames[i2][varName] === val && i !== circle_index)
			{
				return true;
			}
		}
	}
	
	return false;
}

function getCircleIndex(name)
{
	for(let i = 0; i < collection.circles.length; i++)
	{
		if(collection.circles[i].name === name)
		{
			return i;
		}
	}
	
	return null;
}

function addCircle(name)
{
	collection.circles.push({
		name: name,
		hgames: [
		]
	});
	
	return collection.circles.length - 1;
}

function addHgame(data)
{
	return new Promise((resolve, reject) => {	
		let circle_index = getCircleIndex(data.circle);
		
		if(circle_index === null)
		{
			circle_index = addCircle(data.circle);
		}
		
		let existChecks = [
			[data.name, "name"],
			[data.exe_path, "exe_path"]
		];
		
		if(data.jp_name.trim() !== ""){existChecks.push([data.jp_name, "jp_name"])};
		
		let exists = false;
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(hgameExists(existChecks[i][0], existChecks[i][1]) === true)
			{
				exists = true;
				break;
			}
		}
		
		if(exists === true)
		{
			throw "Hgame already added";
		}
		
		let icon = data.icon_path;
		
		let iconCheck;
		
		if(validator.isURL(icon) === true)
		{	
			iconCheck = storage.download_file(icon, __dirname + "/temporary_files/");
		}
		else
		{
			iconCheck = new Promise((resolve, reject) => {resolve()});
		}
		
		iconCheck
		.then(function(result){
			
			let file_name = data.name.replaceAll('\\', '');
			file_name = file_name.replaceAll('//', '');
			file_name = file_name.replaceAll(':', '');
			file_name = file_name.replaceAll('*', '');
			file_name = file_name.replaceAll('?', '');
			file_name = file_name.replaceAll('"', '');
			file_name = file_name.replaceAll('<', '');
			file_name = file_name.replaceAll('>', '');
			file_name = file_name.replaceAll('|', '');
			
			if(result !== undefined)
			{
				return storage.moveFile(result,  __dirname + "/userdata/icons/" + file_name + "." + result.split('.').pop());
			}
			else
			{
				if(icon.includes("./userdata/icons"))
				{
					icon = __dirname + "/" + icon;
				}
				
				return storage.copyFile(icon,  __dirname + "/userdata/icons/" + file_name + "." + icon.split('.').pop());	
			}
		})
		.then(function(result){
			
			result = "./userdata" + result.split('userdata').pop();
			
			let Hgame = {
				name: data.name,
				jp_name: data.jp_name,
				exe_path: data.exe_path,
				icon_path: result,
				tags: data.tags,
				favorite: false
			};
			
			collection.circles[circle_index].hgames.push(Hgame);
			
			return saveJSON("collection.json", collection);
		})
		.then(function(result){
			resolve(collection);
		})
		.catch(function(error){
			reject(error);
		});
	});
}

function addHgameBatchRecursion(hgames, index)
{
	return new Promise((resolve, reject) => {
		
		let data = hgames[index];
		
		let circle_index = getCircleIndex(data.circle);
		
		if(circle_index === null)
		{
			circle_index = addCircle(data.circle);
		}
		
		let existChecks = [
			[data.name, "name"],
			[data.exe_path, "exe_path"]
		];
		
		if(data.jp_name.trim() !== ""){existChecks.push([data.jp_name, "jp_name"])};
		
		let exists = false;
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(hgameExists(existChecks[i][0], existChecks[i][1]) === true)
			{
				exists = true;
				break;
			}
		}
		
		if(exists === true)
		{
			if(index === hgames.length - 1)
			{
				resolve("skipped");
			}
			else
			{
				addHgameBatchRecursion(hgames, index + 1)
				.then(function(result){
					resolve("skipped");
				})
				.catch(function(error){
					reject(error);
				});
			}
		}
		else
		{
			let icon = data.icon_path;
			
			let iconCheck;
			
			if(validator.isURL(icon) === true)
			{	
				iconCheck = storage.download_file(icon, __dirname + "/temporary_files/");
			}
			else
			{
				iconCheck = new Promise((resolve, reject) => {resolve()});
			}
			
			iconCheck
			.then(function(result){
				
				let file_name = data.name.replaceAll('\\', '');
				file_name = file_name.replaceAll('//', '');
				file_name = file_name.replaceAll(':', '');
				file_name = file_name.replaceAll('*', '');
				file_name = file_name.replaceAll('?', '');
				file_name = file_name.replaceAll('"', '');
				file_name = file_name.replaceAll('<', '');
				file_name = file_name.replaceAll('>', '');
				file_name = file_name.replaceAll('|', '');
				
				if(result !== undefined)
				{
					return storage.moveFile(result,  __dirname + "/userdata/icons/" + file_name + "." + result.split('.').pop());
				}
				else
				{
					if(icon.includes("./userdata/icons"))
					{
						icon = __dirname + "/" + icon;
					}
					
					return storage.copyFile(icon,  __dirname + "/userdata/icons/" + file_name + "." + icon.split('.').pop());	
				}
			})
			.then(function(result){
				
				result = "./userdata" + result.split('userdata').pop();
				
				let Hgame = {
					name: data.name,
					jp_name: data.jp_name,
					exe_path: data.exe_path,
					icon_path: result,
					tags: data.tags,
					favorite: false
				};
				
				collection.circles[circle_index].hgames.push(Hgame);
			})
			.then(function(result){
				
				if(index === hgames.length - 1)
				{
					resolve("added");
				}
				else
				{
					addHgameBatchRecursion(hgames, index + 1)
					.then(function(result){
						resolve("added");
					})
					.catch(function(error){
						reject(error);
					});
				}
			})
			.catch(function(error){
				reject(error);
			});
		}
	});
}

function addHgameBatch(data)
{
	return new Promise((resolve, reject) => {
		
		addHgameBatchRecursion(data, 0)
		.then(function(result){
			return saveJSON("collection.json", collection);
		})
		.then(function(result){
			resolve(collection);
		})
		.catch(function(error){
			reject(error);
		});
	});
}

function editHgame(data)
{
	return new Promise((resolve, reject) => {	
		
		//Check edited result won't duplicate another record
		let existChecks = [
			[data.hgame.name, "name"],
			[data.hgame.exe_path, "exe_path"]
		];
		
		if(data.hgame.jp_name.trim() !== ""){existChecks.push([data.hgame.jp_name, "jp_name"])};
		
		let exists = false;
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(hgameExists_notAtIndex(existChecks[i][0], existChecks[i][1], data.circle_index, data.hgame_index) === true)
			{
				exists = true;
				break;
			}
		}
		
		if(exists === true)
		{
			throw "Edit would create duplicate hgame";
		}
		
		let old_icon = collection.circles[data.circle_index].hgames[data.hgame_index].icon_path;
		
		console.log("boog");
		
		collection.circles[data.circle_index].hgames.splice(data.hgame_index, 1); // remove prev record
		
		let circle_index = getCircleIndex(data.hgame.circle);
		
		if(circle_index === null)
		{
			circle_index = addCircle(data.circle);
		}
		
		let icon = data.hgame.icon_path;
		
		if(icon === old_icon)
		{
			let Hgame = {
				name: data.hgame.name,
				jp_name: data.hgame.jp_name,
				exe_path: data.hgame.exe_path,
				icon_path: icon,
				tags: data.hgame.tags,
				favorite: false
			};
			
			collection.circles[circle_index].hgames.push(Hgame);
			
			saveJSON("collection.json", collection)
			.then(function(result){
				resolve(collection);
			})
			.catch(function(error){
				reject(error);
			});
		}
		else
		{
			storage.delete_files([__dirname + "/" + old_icon])
			.then(function(result){
			
				if(validator.isURL(icon) === true)
				{
					return storage.download_file(icon, __dirname + "/temporary_files/");
				}
				else
				{
					return new Promise((resolve, reject) => {resolve()});
				}
			})
			.then(function(result){
				
				let file_name = data.hgame.name.replaceAll('\\', '');
				file_name = file_name.replaceAll('//', '');
				file_name = file_name.replaceAll(':', '');
				file_name = file_name.replaceAll('*', '');
				file_name = file_name.replaceAll('?', '');
				file_name = file_name.replaceAll('"', '');
				file_name = file_name.replaceAll('<', '');
				file_name = file_name.replaceAll('>', '');
				file_name = file_name.replaceAll('|', '');
				
				if(result !== undefined)
				{
					return storage.moveFile(result,  __dirname + "/userdata/icons/" + file_name + "." + result.split('.').pop());
				}
				else
				{
					if(icon.includes("./userdata/icons"))
					{
						icon = __dirname + "/" + icon;
					}
					
					return storage.copyFile(icon,  __dirname + "/userdata/icons/" + file_name + "." + icon.split('.').pop());	
				}
			})
			.then(function(result){
				
				result = "./userdata" + result.split('userdata').pop();
				
				let Hgame = {
					name: data.hgame.name,
					jp_name: data.hgame.jp_name,
					exe_path: data.hgame.exe_path,
					icon_path: result,
					tags: data.hgame.tags,
					favorite: false
				};
				
				collection.circles[circle_index].hgames.push(Hgame);
				
				return saveJSON("collection.json", collection);
			})
			.then(function(result){
				resolve(collection);
			})
			.catch(function(error){
				reject(error);
			});
		}
	});
}

function removeHgame(circle_index, hgame_index)
{
	return new Promise((resolve, reject) => {
		
		let icon_path = collection.circles[circle_index].hgames[hgame_index].icon_path;
		
		collection.circles[circle_index].hgames.splice(hgame_index, 1);
		
		if(collection.circles[circle_index].hgames.length === 0)
		{
			collection.circles.splice(circle_index, 1);
		}
		
		storage.delete_files([__dirname + "/" + icon_path])
		.then(function(result){
			return saveJSON("collection.json", collection);
		})
		.then(function(result){
			resolve(collection);
		})
		.catch(function(error){
			reject("Could not save changes: " + error);
		});
	});
}

function searchCollection(searchTerm)
{
	let result = {
		circles: [],
		hgames: []
	};
	
	for(let i = 0; i < collection.circles.length; i++)
	{
		if(collection.circles[i].name.includes(searchTerm))
		{
			result.circles.push(collection.circles[i]);
		}
	}
	
	for(let i = 0; i < collection.circles.length; i++)
	{
		if(collection.circles[i].hgames.length > 0)
		{
			for(let i2 = 0; i2 < collection.circles[i].hgames.length; i2++)
			{
				if(collection.circles[i].hgames[i2].name.includes(searchTerm))
				{
					result.hgames.push(collection.circles[i].hgames[i2]);
				}
			}
		}
	}
	
	return result;
}

function scanForHgames(directory)
{
	return new Promise((resolve, reject) => {
		
		let applications = [];
		
		let scan_res;
		let identfied = [];
		let unidentfied = [];
		
		storage.scanForExecutable(directory)
		.then(function(result){
			
			scan_res = result;
			
			for(let i = 0; i < scan_res.length; i++)
			{					
				if(scan_res[i].dlsite_url !== undefined)
				{
					scan_res[i].type = "dlsite";
					//Take first path from child directories search
					
					console.log("SPECIAL PATH: " + scan_res[i].paths[0]);
					console.log(scan_res[i]);
					
					scan_res[i].dir_name = scan_res[i].paths[0][0].dir_name;
					scan_res[i].exes = scan_res[i].paths[0][0].exes;
					
					identfied.push(scan_res[i]);
					continue;
				}
				
				let dlsite_url = scraper_importer.getDLsiteFromDirName(scan_res[i].dir_name.split("/").pop().toUpperCase());
				
				if(dlsite_url !== undefined)
				{
					scan_res[i].type = "dlsite";
					scan_res[i].dlsite_url = dlsite_url,
					identfied.push(scan_res[i]);
					continue;
				}
				
				scan_res[i].type = "unknown";
				unidentfied.push(scan_res[i]);
			}
			
			let scrape_imports = [];
			
			for(let i = 0; i < identfied.length; i++)
			{
				if(identfied[i].type === "dlsite")
				{
					//console.log("URL: " + identfied[i].dlsite_url);
					
					scrape_imports.push(scraper_importer.scrapeDLsite(identfied[i].dlsite_url));
				}
				else
				{
					scrape_imports.push(new Promise((resolve, reject) => {resolve()}))
				}
			}
			
			return Promise.all(scrape_imports);
		})
		.then(function(results){
			
			for(let i = 0; i < results.length; i++)
			{
				if(results[i] === undefined)
				{
					
				}
				else
				{
					let application = {
						app: identfied[i]
					};
					
					switch(identfied[i].type)
					{
						case "dlsite":
							application.import_scrape = results[i];
						break;
					}
					
					applications.push(application);
				}
			}
			
			resolve(applications);
		})
		.catch(function(error){
			reject(error);
		});
		
	});
}

function archive_exists(type, val, varName)
{
	let cat_set;
	
	switch(type)
	{
		case "mega":
			cat_set = catalog.mega;
		break;
		
		case "ipfs":
			cat_set = catalog.ipfs;
		break;
	}
	
	console.log(cat_set);
	
	for(let i = 0; i < cat_set.archives.length; i++)
	{
		console.log(val);
		console.log(cat_set.archives[i][varName]);
		
		if(cat_set.archives[i][varName] === val)
		{
			return true;
		}
	}
	
	return false;
}

function addMegaArchive(url, name)
{
	return new Promise((resolve, reject) => {
		let existChecks = [
			[url, "url"]
		];
		
		let exists = false;
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(archive_exists("mega", existChecks[i][0], existChecks[i][1]) === true)
			{
				exists = true;
				break;
			}
		}
		
		if(exists === true)
		{
			reject("Archive already added");
		}
		else
		{
			archives.validateMegaFolderUrl(url)
			.then(function(result){
				catalog.mega.archives.push({
					name: name,
					url: url
				});
				return saveJSON("catalog.json", catalog);
			})
			.then(function(result){
				resolve(catalog);
			})
			.catch(function(error){
				console.log(error);
			});
		}
	});
}

function searchMegaArchive(url, type, searchTerm)
{
	return new Promise((resolve, reject) => {
		
		let applications = [];
		let res = [];
		
		archives.megaCatalog(url, type, searchTerm)
		.then(function(result){			
			for(let i = 0; i < result.length; i++)
			{
				let dlsite_url = scraper_importer.getDLsiteFromDirName(result[i].name);
				
				if(dlsite_url !== undefined)
				{
					result[i].type = "dlsite";
					result[i].dlsite_url = dlsite_url;
					res.push(result[i]);
				}
			}
			
			let scrape_imports = [];
			
			for(let i = 0; i < res.length; i++)
			{
				if(res[i].type === "dlsite")
				{
					scrape_imports.push(scraper_importer.scrapeDLsite(res[i].dlsite_url));
				}
				else
				{
					scrape_imports.push(new Promise((resolve, reject) => {resolve()}))
				}
			}
			
			return Promise.all(scrape_imports);
		})
		.then(function(results){	
			for(let i = 0; i < results.length; i++)
			{
				if(results[i] === undefined)
				{
					
				}
				else
				{
					let application = {
						app: res[i],
						import_scrape: results[i]
					};
					
					applications.push(application);
				}
			}
			
			resolve(applications);
		})
		.catch(function(error){
			console.log(error);
			reject(error);
		});
	});
}

function downloadHgame_mega(url, filename, type, retry)
{
	return new Promise((resolve, reject) => {
		
		console.log("starting download");
		
		if(archives.get_current_downloads(url) === undefined || retry === true)
		{
			switch(type)
			{
				case "mega":
					archives.megaDownload(url, __dirname + "/downloads/" + filename);
					resolve(get_current_downloads(url));
			}
		}
		else
		{
			reject("Download already running or already downloaded.")
		}
	});
}

function openPath(path, relative, file)
{
	if(relative === true)
	{
		path = __dirname + "\\" + path;
	}
	
	if(file === true)
	{
		shell.showItemInFolder(path);
	}
	else
	{
		shell.openPath(path);
	}
		
	
}

function loadJSON(filename)
{
	return new Promise((resolve, reject) => {
		json.get(filename, function(error, data) {
			if (error)
			{ 
				reject(error)
			}
			else
			{
				resolve(data);
			}
		});		
	});
}

function loadJSON_Batch(filenames)
{
	return new Promise((resolve, reject) => {
		json.getMany(filenames, function(error, data) {
			if (error)
			{ 
				reject(error)
			}
			else
			{
				resolve(data);
			}
		});		
	});
}

function saveJSON(filename, data)
{
	return new Promise((resolve, reject) => {
		json.set(filename, data, {"prettyPrinting": true}, function(error) {
			if (error)
			{ 
				reject(error)
			}
			else
			{
				resolve(data);
			}
		});
	});
}