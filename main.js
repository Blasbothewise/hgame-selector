const { app, BrowserWindow, screen, ipcMain, dialog, shell} = require('electron')
const json = require("electron-json-storage");
require('dotenv').config();
const scraper_importer = require('./classes/scraper_importer.js');
const storage = require('./classes/storage.js');
const validator = require("validator");
const spawn = require('child_process').spawn;
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
	
	if(!fs.existsSync(__dirname + "/install"))
	{
		fs.mkdirSync(__dirname + "/install");
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
			catalog.mega = {
				archives: []
			};
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
		
		if(config.ipfs_daemon_hostname === undefined)
		{
			config.ipfs_daemon_hostname = "http://127.0.0.1:5001";
		}
		
		if(config.downloads_path === undefined)
		{
			config.downloads_path = __dirname + "\\downloads";
		}
		
		initialiseComms();
		
		saveJSON("collection.json", collection);
		saveJSON("catalog.json", catalog);
		saveJSON("config.json", config);
	})
	.catch(function(error){
		console.log(error);
	});
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
		let type = args.split(".").pop().toLowerCase();
		
		switch(type)
		{
			case "exe":
				let app = spawn(args, [],{detached: true}, function(err, data){
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
				
				app.stderr.on('data', (data) => {
					console.error(`stderr: ${data}`);
				});
			break;
			case "swf":
				try
				{
					shell.openPath(args);
					event.reply('executeEXE_res', {status: "success"});
				}
				catch(e)
				{
					event.reply('executeEXE_res', {status: "error", message: e});
				}
			break;
		}
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
			event.reply('getFolderPath_res', {status: "success", data: result.filePaths[0], tbx: args});
		})
		.catch(function(error)
		{
			event.reply('getFolderPath_res', {status: "error", message: error, tbx: args});
		});
	});
	
	ipcMain.on('getFilePath', (event, args) => {
		dialog.showOpenDialog(win, {properties: []})
		.then(function(result)
		{
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
	
	ipcMain.on('addArchive', (event, args) => {
		addArchive(args.url, args.name, args.type)
		.then(function(result)
		{
			event.reply('addArchive_res', {status: "success", data: result, type: args.type});
		})
		.catch(function(error)
		{
			event.reply('addArchive_res', {status: "error", message: error, type: args.type});
		});
	});
	
	ipcMain.on('getCatalog', (event, args) => {
		event.reply('getCatalog_res', {status: "success", data: catalog});
	});
	
	ipcMain.on('searchArchive', (event, args) => {
		
		console.log(args);
		
		searchArchive(args.url, args.type, args.archive_type, args.searchTerm)
		.then(function(result)
		{
			event.reply('searchArchive_res', {status: "success", data: result, container: args.container, archive_type: args.archive_type});
		})
		.catch(function(error)
		{
			if(error.code === 'ECONNREFUSED' && args.archive_type === "ipfs")
			{
				event.reply('searchArchive_res', {status: "error", message: "Could not connect to local IPFS daemon", archive_type: args.archive_type});
			}
			else
			{
				event.reply('searchArchive_res', {status: "error", message: error, archive_type: args.archive_type});
			}
		});
	});
	
	ipcMain.on('downloadHgame', (event, args) => {
		downloadHgame(args.url, args.filename, args.type, args.retry)
		.then(function(result)
		{
			event.reply('downloadHgame_res', {status: "success", data: result});
		})
		.catch(function(error)
		{
			if(error.code === 'ECONNREFUSED' && args.type === "ipfs")
			{
				event.reply('searchArchive_res', {status: "error", message: "Could not connect to local IPFS daemon", archive_type: args.archive_type});
			}
			else
			{
				event.reply('downloadHgame_res', {status: "error", message: error});
			}
			
			event.reply('downloadHgame_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('get_download_progress', (event, args) => {
		let download = archives.get_current_downloads(args);
		
		if(download !== undefined || download.status != "failed")
		{
			event.reply('get_download_progress_res', {status: "success", data: download, url: args});
		}
		else
		{
			let message = "Download does not exist";
			
			if(download.status === "failed")
			{
				message = download.error;
			}
			
			event.reply('get_download_progress_res', {status: "error", message: message, url: args});
		}
	});
	
	ipcMain.on('openPath', (event, args) => {
		openPath(args.path, args.relative, args.file);
	});
	
	ipcMain.on('cancelDownload', (event, args) => {
		
		archives.cancelDownload(args);
		
		event.reply('cancelDownload_res', {status: "success", data: args});
	});
	
	ipcMain.on('setConfig', (event, args) => {
		setConfig(args)
		.then(function(result)
		{
			event.reply('setConfig_res', {status: "success", data: result});
		})
		.catch(function(error)
		{
			event.reply('setConfig_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('getConfig', (event, args) => {
		event.reply('getConfig_res', {status: "success", data: config});
	});
	
	ipcMain.on('removeArchive', (event, args) => {
		removeArchive(args.url, args.type)
		.then(function(result)
		{
			event.reply('removeArchive_res', {status: "success", data: result, url: args.url, type: args.type});
		})
		.catch(function(error)
		{
			event.reply('removeArchive_res', {status: "error", message: error, url: args.url, type: args.type});
		});
	});
	
	ipcMain.on('clearDownload', (event, args) => {
		archives.clearDownload(args);
	});
	
	ipcMain.on('testIpfsDaemon_config', (event, args) => {
		archives.testIpfsDaemon_config(args.hostname)
		.then(function(result)
		{
			event.reply('testIpfsDaemon_config_res', {status: "success", message: "IPFS daemon successfully connected."});
		})
		.catch(function(error)
		{
			event.reply('testIpfsDaemon_config_res', {status: "error", message: error});
		});
	});
	
	ipcMain.on('reconnect_ipfs', (event, args) => {
		archives.reconnect_ipfs(args.hostname);
	});
	
	scraper_importer.loginVNDB_basic()
	.then(function(result){
		console.log(result);
	})
	.catch(function(error){
		console.log(error);
	});
	
	archives.initialiseIPFS(config.ipfs_daemon_hostname);
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
			
			let file_name = result.split("/").pop();
			
			if(result !== undefined)
			{
				return storage.moveFile(result,  __dirname + "/userdata/icons/" + file_name);
			}
			else
			{
				if(icon.includes("./userdata/icons"))
				{
					icon = __dirname + "/" + icon;
				}
				
				return storage.copyFile(icon,  __dirname + "/userdata/icons/" + file_name);	
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
				
				let file_name = result.split("/").pop();
				
				if(result !== undefined)
				{
					return storage.moveFile(result,  __dirname + "/userdata/icons/" + file_name);
				}
				else
				{
					if(icon.includes("./userdata/icons"))
					{
						icon = __dirname + "/" + icon;
					}
					
					return storage.copyFile(icon,  __dirname + "/userdata/icons/" + file_name);	
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
				
				let file_name = result.split("/").pop();
				
				if(result !== undefined)
				{
					return storage.moveFile(result,  __dirname + "/userdata/icons/" + file_name);
				}
				else
				{
					if(icon.includes("./userdata/icons"))
					{
						icon = __dirname + "/" + icon;
					}
					
					return storage.copyFile(icon,  __dirname + "/userdata/icons/" + file_name);	
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
		
		if(collection.circles[i].hgames.length > 0)
		{
			for(let i2 = 0; i2 < collection.circles[i].hgames.length; i2++)
			{
				let tag_match = false;
				
				for(let i3 = 0; i3 < collection.circles[i].hgames[i2].tags.length; i3++)
				{
					if(collection.circles[i].hgames[i2].tags[i3].toLowerCase() === searchTerm)
					{	
						tag_match = true;
						break;
					}
				}
				
				if(collection.circles[i].hgames[i2].name.includes(searchTerm) || tag_match === true)
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
			
			console.log("result");
			console.log(result);
			
			if(result === null)
			{
				resolve(applications);
			}
			else
			{
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
			}
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

function addArchive(url, name, type)
{
	return new Promise((resolve, reject) => {
		let existChecks = [
			[url, "url"]
		];
		
		let exists = false;
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(archive_exists(type, existChecks[i][0], existChecks[i][1]) === true)
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
			let validate;
			
			switch(type)
			{
				case "mega":
					validate = archives.validateMegaFolderUrl(url);
				break;
				
				case "ipfs":
					validate = new Promise((resolve, reject) => {resolve()}); // Add some hash validation function here
				break;
			}
			
			validate
			.then(function(result){
				catalog[type].archives.push({
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

function searchArchive(url, type, archive_type, searchTerm)
{
	return new Promise((resolve, reject) => {
		
		let getFiles;
		
		switch(archive_type)
		{
			case "mega":
				getFiles = archives.megaCatalog(url, type, searchTerm);
			break;
			
			case "ipfs":
				getFiles = archives.catalogIPFS(url, type, searchTerm);
			break;
		}
		
		let applications = [];
		let res = [];

		getFiles
		.then(function(result){	

			console.log("res:");
			console.log(result);
		
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

function downloadHgame(url, filename, type, retry)
{
	return new Promise((resolve, reject) => {
		
		console.log("starting download");
		
		if(archives.get_current_downloads(url) === undefined || retry === true)
		{
			archives.clearDownload(url);
			
			switch(type)
			{
				case "mega":
					archives.megaDownload(url, config.downloads_path + "/" + filename);
					resolve(get_current_downloads(url));
				break;
				
				case "ipfs":
					archives.directDownload(url, config.downloads_path + "/" + filename);
					resolve(get_current_downloads(url));
				break;
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
	console.log(path);
	
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

function setConfig(conf)
{
	return new Promise((resolve, reject) => {
		if(!fs.existsSync(conf.downloads_path))
		{
			reject("Downloads path invalid.");
		}
		
		//if(!fs.existsSync(conf.install_path))
		//{
		//	reject("Install path invalid.");
		//}
		
		config = conf;
		
		saveJSON("config.json", config)
		.then(function(result){
			resolve(config);
		})
		.catch(function(error){
			reject(error);
		});
	});
}

function removeArchive(url, type)
{
	return new Promise((resolve, reject) => {
		
		if(catalog[type] === undefined)
		{
			reject("Catalog type does not exist");
		}
		
		for(let i = 0; i < catalog[type].archives.length; i++)
		{
			if(catalog[type].archives[i].url === url)
			{
				catalog[type].archives.splice(i, 1);
				break;
			}
		}
		
		saveJSON("catalog.json", catalog)
		.then(function(result){
			resolve(config);
		})
		.catch(function(error){
			reject(error);
		});
	});
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