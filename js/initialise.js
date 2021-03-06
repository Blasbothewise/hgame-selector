function file_dialog(event)
{	
	document.getElementById(event.target.getAttribute("file_input")).click();
}

function add_tag(source_elem_id, cntr_id)
{
	let value = document.getElementById(source_elem_id).value.trim().toLowerCase();
	
	if(value !== "")
	{
		let add_edit_tag = document.createElement("DIV");
		add_edit_tag.classList.add("add_edit_tag");
		add_edit_tag.innerHTML = value;
		
		let container = document.getElementById(cntr_id);
		container.appendChild(add_edit_tag);
		
		if(container.value === undefined)
		{
			container.value = "";
		}
		
		if(container.value.length === 0)
		{
			container.value = value;
		}
		else
		{
			container.value = container.value += "£" + value;
		}
		
		add_edit_tag.addEventListener('click', function(event){
				
			let value = event.target.innerHTML;
			
			container.value = container.value.replace(value, "");
			
			if(container.value.substring(0, 1) === '£')
			{
				container.value = container.value.substring(1, container.value.length);
			}
			else if(container.value.substring(container.value.length - 1, container.value.length) === '£')
			{
				container.value = container.value.substring(0, container.value.length - 1);
			}
			else
			{
				container.value = container.value.replace('££','£');
			}
			
			event.target.parentNode.removeChild(event.target);
		});
	}
	
	document.getElementById(source_elem_id).value = "";
}

function changePage(new_tab, target)
{	
	console.log(target);

	if(new_tab.ariaSelected === 'false' || new_tab.ariaSelected === null)
	{
		let current_tab = document.getElementsByClassName("tab current")[0];
		current_tab.ariaSelected = false;
		current_tab.classList.toggle("current");

		let pages = document.getElementsByClassName("page_container");

		for(let i = 0; i < pages.length; i++)
		{
			pages[i].classList.add("hidden");
		}

		let target_page = document.getElementById(target);
		target_page.classList.remove("hidden");
		new_tab.ariaSelected = true;
		new_tab.classList.toggle("current");
	}
	/*
	if(new_tab.id === "home_tab")
	{
		populateHome("circles", { collection: collection });
	}*/
}

function printError(message)
{
	let error_box = document.getElementById("error_box");
	
	error_box.style.transition = null;
	error_box.style.display = "flex";
	error_box.innerHTML = message;
	
	let interval = setInterval(function(){
		
		error_box.style.transition = "visbility 5s, opacity 0.5s linear";
		error_box.style.display = "none";
		error_box.innerHTML = "";
		clearInterval(interval);
	}, 5000);
}

function printSuccess(message)
{
	let success_box = document.getElementById("success_box");
	
	success_box.style.transition = null;
	success_box.style.display = "flex";
	success_box.innerHTML = message;
	
	let interval = setInterval(function(){
		
		success_box.style.transition = "visbility 5s, opacity 0.5s linear";
		success_box.style.display = "none";
		success_box.innerHTML = "";
		clearInterval(interval);
	}, 5000);
}

const { ipcRenderer } = require('electron');

function initialise_comms()
{
	/*
	################
	# Data imports #
	################
	*/
	
	ipcRenderer.on('scrape_dlsite_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			populateDlsiteData(args.data);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
		
		if(document.getElementById("add_tab").ariaSelected === "true")
		{
			enable_import_form(document.getElementById("add_dlsite_import_submit"));
		}
		
		if(document.getElementById("edit_tab").ariaSelected === "true")
		{
			enable_import_form(document.getElementById("edit_dlsite_import_submit"));
		}
	});
	
	ipcRenderer.on('import_vndb_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			populateVNDBData(args.data);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
		
		if(document.getElementById("add_tab").ariaSelected === "true")
		{
			enable_import_form(document.getElementById("add_vndb_import_submit"));
		}
		
		if(document.getElementById("edit_tab").ariaSelected === "true")
		{
			enable_import_form(document.getElementById("edit_vndb_import_submit"));
		}
	});
	
	ipcRenderer.on('addHgame_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			collection = args.data;
			clearAddForm();
			populateHome("circles", { collection: collection });
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('removeHgame_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			collection = args.data;
			clearEditForm();
			populateHome("circles", { collection: collection });
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('editHgame_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			collection = args.data;
			clearEditForm();
			populateHome("circles", { collection: collection });
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('getCollection_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			collection = args.data
			populateHome("circles", { collection: collection });
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('executeEXE_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			//Do something
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('scanForHgames_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			populateBatch(args.data);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			enable_batch_form();
		}
	});
	
	ipcRenderer.on('batchAddHgames_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			collection = args.data;
			clear_batch_results();
			populateHome("circles", { collection: collection });
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			enable_batch_results();
		}
	});
	
	ipcRenderer.on('addArchive_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			
			catalog = args.data;
			addArchivePage(catalog[args.type].archives[catalog[args.type].archives.length - 1], args.type);
			enable_add_archive(args.type);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			enable_add_archive(args.type);
		}
	});
	
	ipcRenderer.on('getCatalog_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			catalog = args.data
			populateCatalog();
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('searchArchive_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			populate_archive(args.data, args.container, args.archive_type);
			enableSearch_form(args.container);
		}
		else
		{
			console.log(args);
			printError(args.message);
			enableSearch_form(args.container);
		}
	});
	
	ipcRenderer.on('get_download_progress_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			updateDownload(args.data, args.url);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			
			updateDownload({retrieved_bytes: 0, status: "failed"}, args.url);
		}
	});
	
	ipcRenderer.on('cancelDownload_res', (event, args) => {
		if(args.status === "success")
		{
			console.log("url: ", args.url);
			
			//removeDownload(args);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			
			enable_download_cancel(args);
		}
	});
	
	ipcRenderer.on('setConfig_res', (event, args) => {
		if(args.status === "success")
		{
			config = args.data;
			populate_config(config);
			printSuccess("Configuration saved");
			enableConfigForm();
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			
			enableConfigForm();
		}
	});
	
	ipcRenderer.on('getConfig_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			config = args.data
			populate_config(config);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
	
	ipcRenderer.on('removeArchive_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			catalog = args.data
			removeArchivePage(args.url, args.type);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			enableRemoveArchive(args.type);
		}
	});
	
	ipcRenderer.on('testIpfsDaemon_config_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			printSuccess(args.message);
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
	});
}

var collection, catalog, config;

function initialise()
{
	initialise_comms(); //Must come first
	initialise_home();
	init_Add_Page();
	init_edit_Page();
	init_batch_Page();
	init_catalog_page();
	init_config();
	
	ipcRenderer.send('getCollection', undefined);
	ipcRenderer.send('getCatalog', undefined);
	ipcRenderer.send('getConfig', undefined);
	
	let tabs = document.getElementsByClassName("tab");

	for(let i = 0; i < tabs.length; i++)
	{
		if(i === 0)
		{
			tabs[i].ariaSelected = true;
		}
		else
		{
			tabs[i].ariaSelected = false;
		}
		
		tabs[i].addEventListener('click', function(event){
			changePage(this, this.getAttribute("page_id"));
		});
	}
}

initialise();