const { app, BrowserWindow, screen, ipcMain } = require('electron')
const json = require("electron-json-storage");
require('dotenv').config();
const scraper_importer = require('./classes/scraper_importer.js');
const storage = require('./classes/storage.js');
const validator = require("validator");
const child = require('child_process').execFile;
const WebSocket = require('ws');
const fs = require('fs');

const vndb_socket = new WebSocket('ws://api.vndb.org:19534', {
	perMessageDeflate: false
});


function createWindow () {
	const win = new BrowserWindow({
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

var collection, config;

function initialiseApp()
{
	console.log(__dirname);
	
	if(!fs.existsSync(__dirname + "/temporary_files"))
	{
		fs.mkdirSync(__dirname + "/temporary_files");
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
	
	loadJSON_Batch(["collection.json", "config.json"])
	.then(function(result){
		
		collection = result.collection.json;
		
		if(collection.circles === undefined)
		{
			collection.circles = [];
		}
		
		config = result.config.json;
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
		scraper_importer.importVNDB(args /*creds here*/)
		.then(function(result){
			event.reply('scrape_dlsite_res', {status: "success", data: result});
		})
		.catch(function(error){
			event.reply('scrape_dlsite_res', {status: "error", message: error});
		});
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
	
	ipcMain.on('editSettings', (event, args) => {
		
	});
	
	ipcMain.on('getSettings', (event, args) => {
		event.reply('getCollection_res', {status: "success", data: collection});
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
	
	init_vndb_websocket();
}

function init_vndb_websocket()
{
	vndb_socket.on('open', function open() {
		vndb_socket.send("login {\"protocol\":0,\"client\":\"hgame_selector\",\"clientver\":0.5}");
	});
	
	vndb_socket.on('message', function incoming(data) {
		console.log(data);
	});
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
			[data.jp_name, "jp_name"],
			[data.exe_path, "exe_path"]
		];
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(hgameExists(existChecks[i][0], existChecks[i][1]) === true)
			{
				throw "Hgame already exists";
			}
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
			
			result = "userdata" + result.split('userdata').pop();
			
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

function editHgame(data)
{
	return new Promise((resolve, reject) => {	
		
		collection.circles[data.circle_index].hgames.splice(data.hgame_index, 1); // remove prev record
		
		let circle_index = getCircleIndex(data.hgame.circle);
		
		if(circle_index === null)
		{
			circle_index = addCircle(data.circle);
		}
		
		let existChecks = [
			[data.hgame.name, "name"],
			[data.hgame.jp_name, "jp_name"],
			[data.hgame.exe_path, "exe_path"]
		];
		
		for(let i = 0; i < existChecks.length; i++)
		{
			if(hgameExists(existChecks[i][0], existChecks[i][1]) === true)
			{
				throw "Hgame already exists";
			}
		}
		
		let icon = data.hgame.icon_path;
		
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
			
			result = "userdata" + result.split('userdata').pop();
			
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