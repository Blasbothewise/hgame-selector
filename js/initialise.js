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
	
	if(new_tab.id === "home_tab")
	{
		populateHome("circles", { collection: collection });
	}
}

function printError(message)
{
	let error_box = document.getElementById("error_box");
	
	error_box.style.transition = null;
	error_box.style.display = "flex";
	error_box.innerHTML = message;
	
	let interval = setInterval(function(){
		
		error_box.style.transition = "visbility 2s, opacity 0.5s linear";
		error_box.style.display = "none";
		error_box.innerHTML = "";
		clearInterval(interval);
	}, 2000);
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
		}
	});
	
	ipcRenderer.on('getFolderPath_res', (event, args) => {
		if(args.status === "success")
		{
			console.log(args);
			switch(args.data.type)
			{
				case "batch_dir":
					console.log(args.data.val);
					document.getElementById("batch_tbx").value = args.data.val;
				break;
			}
		}
		else
		{
			console.log(args.message);
			printError(args.message);
			
			switch(args.type)
			{
				case "batch_dir":
					
				break;
			}
		}
	});
}

let collection;

function initialise()
{
	initialise_comms(); //Must come first
	initialise_home();
	init_Add_Page();
	init_edit_Page();
	init_batch_Page();
	
	ipcRenderer.send('getCollection', undefined);
	
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