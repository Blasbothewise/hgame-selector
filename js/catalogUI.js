

function changePage_catalog(new_tab, target, tabClass, pageClass)
{	
	console.log(target);

	if(new_tab.ariaSelected === 'false' || new_tab.ariaSelected === null)
	{
		let current_tab = document.getElementsByClassName(tabClass)[0];
		current_tab.ariaSelected = false;
		current_tab.classList.toggle("current");

		let pages = document.getElementsByClassName(pageClass);

		for(let i = 0; i < pages.length; i++)
		{
			pages[i].classList.add("hidden");
		}

		let target_page = document.getElementById(target);
		target_page.classList.remove("hidden");
		new_tab.ariaSelected = true;
		new_tab.classList.toggle("current");
	}
}

function closeAddarchive()
{
	this.parentNode.parentNode.classList.add("hidden");
	document.getElementById(this.getAttribute("show_btn")).addEventListener("click", show_add_archive);
}

function enable_add_archive(type)
{
	let mega_close = document.getElementById("add_archive_close_" + type);
	mega_close.classList.toggle("disabled");
	mega_close.addEventListener('click', closeAddarchive);
	
	let url = document.getElementById("add_archive_url_" + type);
	url.disabled = false;
	
	document.getElementById("add_archive_name_" + type).disabled = false;
	
	let sub_btn = document.getElementById("add_archive_submit_" + type);
	
	sub_btn.addEventListener('click', addArchive);
	sub_btn.classList.toggle("disabled");
}

function removeArchive()
{
	let type = this.getAttribute("archive_type");
	
	let tab = document.querySelectorAll("#catalog_" + type +" .tab_archive.current")[0];
	
	this.classList.add("disabled");
	this.removeEventListener("click", removeArchive);
	
	ipcRenderer.send('removeArchive', {url: tab.getAttribute("url"), type: type});
}

function enableRemoveArchive(type)
{
	let btn = document.getElementById(type + "_remove_archive");
	btn.classList.remove("disabled");
	btn.addEventListener("click", removeArchive);
}

function addArchive()
{
	let type = this.getAttribute("archive_type");
	
	let mega_close = document.getElementById("add_archive_submit_" + type);
	mega_close.classList.toggle("disabled");
	mega_close.removeEventListener('click', closeAddarchive);
	
	let name = document.getElementById("add_archive_name_" + type);
	name.disabled = true;
	
	let url = document.getElementById("add_archive_url_" + type);
	url.disabled = true;
	
	this.removeEventListener('click', addArchive);
	this.classList.toggle("disabled");
	
	ipcRenderer.send('addArchive', {url: url.value.trim(), name: name.value.trim(), type: type});
}

function removeArchivePage(url, type)
{
	let tabs = document.querySelectorAll("#catalog_" + type + " .tab_archive");
	
	for(let i = 0; i < tabs.length; i++)
	{
		if(tabs[i].getAttribute("url") === url)
		{
			let page = document.getElementById(tabs[i].getAttribute("page_id"));
			page.parentNode.removeChild(page);
			
			tabs[i].parentNode.removeChild(tabs[i]);
			break;
		}
	}
	
	tabs = document.querySelectorAll("#catalog_" + type + " .tab_archive");
	
	console.log(tabs);
	
	if(tabs.length >= 2)
	{
		tabs[0].ariaSelected = true;
		tabs[0].classList.add("current");
		document.getElementById(tabs[0].getAttribute("page_id")).classList.remove("hidden");
	}
	else
	{
		document.getElementById(type + "_search_cntr").style.display = "none";
	}
}

function populateCatalog()
{
	if(catalog.mega.archives.length > 0)
	{
		document.getElementById("mega_search_cntr").style.display = "flex";
		
		for(let i = 0; i < catalog.mega.archives.length; i++)
		{
			addArchivePage( catalog.mega.archives[i], "mega");
		}
	}
	
	if(catalog.ipfs.archives.length > 0)
	{
		document.getElementById("ipfs_search_cntr").style.display = "flex";
		
		for(let i = 0; i < catalog.ipfs.archives.length; i++)
		{
			addArchivePage( catalog.ipfs.archives[i], "ipfs");
		}
	}
}

function addArchivePage(archive, type)
{	
	let tab_archive = document.createElement("DIV");
	tab_archive.innerHTML = archive.name;
	tab_archive.classList.add("tab_archive");
	tab_archive.id = "catalog_tab_" + type + "_" + archive.name;
	tab_archive.setAttribute("page_id", "archive_" + type + "_" + archive.name);
	tab_archive.setAttribute("url", archive.url);
	
	let archive_page = document.createElement("DIV");
	archive_page.classList.add("archive_page");
	archive_page.id = "archive_" + type + "_" + archive.name;
	
	if(document.querySelectorAll("#catalog_" + type + " .tab_archive").length === 1)
	{
		tab_archive.ariaSelected = true;
		tab_archive.classList.add("current");
		document.getElementById(type + "_search_cntr").style.display = "flex";
	}
	else
	{
		tab_archive.ariaSelected = false;
		archive_page.classList.add("hidden");
	}
	
	tab_archive.addEventListener('click', function(event){
		changePage_catalog(this, this.getAttribute("page_id"), "tab_archive current", "archive_page");
	});
	
	let tabs_box = document.getElementById("tabs_" + type);
	tabs_box.insertBefore(tab_archive, tabs_box.children[tabs_box.children.length - 1])
	
	document.getElementById("catalog_" + type).appendChild(archive_page);
	document.getElementById("add_archive_box_" + type).classList.add("hidden");
}



function downloadHgameMega()
{
	if(downloads[this.parentNode.parentNode.getAttribute("url")] !== undefined)
	{
		printError("Already downloading.");
	}
	else if(downloads_count < 4)
	{	
		this.removeEventListener("click", downloadHgameMega);
		this.classList.toggle("archive_result_btn_disabled");
		
		let elem = this;
		
		let enable = setInterval(function(){
			elem.addEventListener("click", downloadHgameMega);
			elem.classList.toggle("archive_result_btn_disabled");
			clearInterval(enable);
		}, 10000)
		
		let url = this.parentNode.parentNode.getAttribute("url");
		let metadata = {
			name: this.parentNode.parentNode.getAttribute("name"),
			jp_name: this.parentNode.parentNode.getAttribute("jp_name"),
			circle: this.parentNode.parentNode.getAttribute("circle"),
			icon: this.parentNode.parentNode.getAttribute("icon"),
			dlsite_code: this.parentNode.getAttribute("dlsite_code"),
		};
		
		downloads[url] = { interval: setInterval(function(){
				ipcRenderer.send('get_download_progress_mega', url);
			}, 3000),
			type: "mega",
			size:  bytes_to_readable(this.parentNode.parentNode.getAttribute("filesize"),true),
			image: this.parentNode.parentNode.getAttribute("icon"),
			filename: this.parentNode.parentNode.getAttribute("filename"),
			url: url
		};
		
		addDownload(downloads[url]);
		
		ipcRenderer.send('downloadHgame_mega', {url: url, filename: this.parentNode.parentNode.getAttribute("filename"), type: "mega", retry: false});
		
		downloads_count++;
	}
	else
	{
		printError("Concurrent download threshold met.");
	}
}

function downloadHgame()
{
	let type = this.parentNode.parentNode.getAttribute("archive_type");
	
	if(downloads[this.parentNode.parentNode.getAttribute("url")] !== undefined)
	{
		printError("Already downloading.");
	}
	else if(downloads_count < 4)
	{	
		this.removeEventListener("click", downloadHgame);
		this.classList.toggle("archive_result_btn_disabled");
		
		let elem = this;
		
		let enable = setInterval(function(){
			elem.addEventListener("click", downloadHgame);
			elem.classList.toggle("archive_result_btn_disabled");
			clearInterval(enable);
		}, 10000);
		
		let url = this.parentNode.parentNode.getAttribute("url");
		let metadata = {
			name: this.parentNode.parentNode.getAttribute("name"),
			jp_name: this.parentNode.parentNode.getAttribute("jp_name"),
			circle: this.parentNode.parentNode.getAttribute("circle"),
			icon: this.parentNode.parentNode.getAttribute("icon"),
			dlsite_code: this.parentNode.getAttribute("dlsite_code"),
		};
		
		downloads[url] = { interval: setInterval(function(){
				ipcRenderer.send('get_download_progress', url);
			}, 3000),
			type: type,
			size:  bytes_to_readable(this.parentNode.parentNode.getAttribute("filesize"),true),
			image: this.parentNode.parentNode.getAttribute("icon"),
			filename: this.parentNode.parentNode.getAttribute("filename"),
			url: url
		};
		
		addDownload(downloads[url]);
		
		ipcRenderer.send('downloadHgame', {url: url, filename: this.parentNode.parentNode.getAttribute("filename"), type: type, retry: false});
		
		downloads_count++;
	}
	else
	{
		printError("Concurrent download threshold met.");
	}
}

function downloadHgameIpfs()
{
	
}

function bytes_to_readable(bytes, suffix)
{
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	
	if(bytes === 0)
	{
		return "0 bytes";
	}
	else
	{
		let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		
		if(suffix === true)
		{
			return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
		}
		else
		{
			return Math.round(bytes / Math.pow(1024, i), 2);
		}
	}
}

function populate_archive(results, container, type)
{
	let res_cntr = document.getElementById(container);
	
	while(res_cntr.firstChild)
	{
		res_cntr.removeChild(res_cntr.firstChild);
	}
	
	for(let i = 0; i < results.length; i++)
	{
		let archive_result = document.createElement("div");
		archive_result.classList.add("archive_result");
		archive_result.setAttribute("name", results[i].import_scrape.name.name);
		archive_result.setAttribute("jp_name", results[i].import_scrape.jp_name);
		archive_result.setAttribute("circle", results[i].import_scrape.brand.name);
		archive_result.setAttribute("icon", results[i].import_scrape.icon);
		archive_result.setAttribute("url", results[i].app.link);
		archive_result.setAttribute("filename", results[i].app.name);
		archive_result.setAttribute("dlsite_code", results[i].import_scrape.name.code);
		archive_result.setAttribute("filesize", results[i].app.size);
		archive_result.setAttribute("cdn", results[i].app.cdn);
		archive_result.setAttribute("archive_type", type);
		
		let tags = ""
		let tags_string = "";
		
		if(results[i].import_scrape.product_metadata.Genre === undefined)
		{
			console.log(results[i]);
		}
		
		for(let i2 = 0; i2 < results[i].import_scrape.product_metadata.Genre.items.length; i2++)
		{
			if(i2 === 0)
			{
				tags = tags_string = results[i].import_scrape.product_metadata.Genre.items[i2].trim();
			}
			else
			{
				tags += "£" + results[i].import_scrape.product_metadata.Genre.items[i2].trim();
				tags_string += ",\n" + results[i].import_scrape.product_metadata.Genre.items[i2].trim();
			}
		}
		
		archive_result.setAttribute("tags", tags);
		
			let archive_result_row = document.createElement("div");
			archive_result_row.classList.add("archive_result_row");
				
				let archive_res_icon = document.createElement("div");
				archive_res_icon.classList.add("archive_res_icon");
				archive_res_icon.style.backgroundImage = 'url("' + results[i].import_scrape.icon + '")';
				
				let archive_res_col_1 = document.createElement("div");
				archive_res_col_1.classList.add("archive_res_col_1");
				archive_res_col_1.innerHTML = results[i].app.name;
				
				let archive_res_col_2 = document.createElement("div");
				archive_res_col_2.classList.add("archive_res_col_2");
				archive_res_col_2.innerHTML = results[i].import_scrape.name.code;
				
				let archive_res_col_3 = document.createElement("div");
				archive_res_col_3.classList.add("archive_res_col_3");
				archive_res_col_3.innerHTML = tags_string;
				
				let archive_res_col_4 = document.createElement("div");
				archive_res_col_4.classList.add("archive_res_col_4");
				archive_res_col_4.innerHTML = bytes_to_readable(results[i].app.size, true);
				
				let archive_result_btn = document.createElement("div");
				archive_result_btn.classList.add("archive_result_btn");
				archive_result_btn.innerHTML = "download";
				
				archive_result_btn.addEventListener('click', downloadHgame);
			
			archive_result_row.appendChild(archive_res_icon);
			archive_result_row.appendChild(archive_res_col_1);
			archive_result_row.appendChild(archive_res_col_2);
			archive_result_row.appendChild(archive_res_col_3);
			archive_result_row.appendChild(archive_res_col_4);
			archive_result_row.appendChild(archive_result_btn);
			
		archive_result.appendChild(archive_result_row);
		
		res_cntr.appendChild(archive_result);
	}
}
/*
function enableSearch_form_mega()
{
	document.getElementById("mega_search_tbx").disabled = false;
	let sub_btn = document.getElementById("mega_search_submit");
	sub_btn.classList.toggle("page_search_btn_disabled");
	sub_btn.addEventListener('click', search_archive);
	
	let all_btn = document.getElementById("mega_get_all")
	all_btn.classList.toggle("page_search_btn_disabled");
	all_btn.addEventListener('click', getAll_archive_res);
}*/

function enableSearch_form(type)
{
	document.getElementById(type + "_search_tbx").disabled = false;
	let sub_btn = document.getElementById(type + "_search_submit");
	sub_btn.classList.toggle("page_search_btn_disabled");
	sub_btn.addEventListener('click', search_archive);
	
	let all_btn = document.getElementById(type + "_get_all")
	all_btn.classList.toggle("page_search_btn_disabled");
	all_btn.addEventListener('click', getAll_archive_res);
}
/*
function disableSearch_form()
{
	document.getElementById("mega_search_tbx").disabled = true;
	let sub_btn = document.getElementById("mega_search_submit");
	sub_btn.classList.toggle("page_search_btn_disabled");
	sub_btn.removeEventListener('click', search_archive);
	
	let all_btn = document.getElementById("mega_get_all")
	all_btn.classList.toggle("page_search_btn_disabled");
	all_btn.removeEventListener('click', getAll_archive_res);
}*/

function disableSearch_form(type)
{
	document.getElementById(type + "_search_tbx").disabled = true;
	let sub_btn = document.getElementById(type + "_search_submit");
	sub_btn.classList.toggle("page_search_btn_disabled");
	sub_btn.removeEventListener('click', search_archive);
	
	let all_btn = document.getElementById(type + "_get_all")
	all_btn.classList.toggle("page_search_btn_disabled");
	all_btn.removeEventListener('click', getAll_archive_res);
}

function search_archive()
{
	let type = this.getAttribute("archive_type");
	
	disableSearch_form(type);
	
	let cat;
	
	switch(type)
	{
		case "mega":
		
			cat = catalog.mega;
		
		break;
		
		case "ipfs":
		
			cat = catalog.ipfs;
		
		break;
	}
	
	let archive;
	
	for(let i = 0; i < cat.archives.length; i++)
	{
		if(document.querySelectorAll("#catalog_" + type +" .tab_archive.current")[0].innerHTML === cat.archives[i].name)
		{
			archive = cat.archives[i];
			break;
		}
	}
	
	ipcRenderer.send('searchArchive', {url: archive.url, type: "search", searchTerm: document.getElementById(type + "_search_tbx").value.trim(), archive_type: type, container: "archive_" + type + "_" + archive.name});
}

function search_archive_func(type)
{	
	disableSearch_form(type);
	
	let cat;
	
	switch(type)
	{
		case "mega":
		
			cat = catalog.mega;
		
		break;
		
		case "ipfs":
		
			cat = catalog.ipfs;
		
		break;
	}
	
	let archive;
	
	for(let i = 0; i < cat.archives.length; i++)
	{
		if(document.querySelectorAll("#catalog_" + type +" .tab_archive.current")[0].innerHTML === cat.archives[i].name)
		{
			archive = cat.archives[i];
			break;
		}
	}
	
	ipcRenderer.send('searchArchive', {url: archive.url, type: "search", searchTerm: document.getElementById(type + "_search_tbx").value.trim(), archive_type: type, container: "archive_" + type + "_" + archive.name});
}

function getAll_archive_res()
{
	let type = this.getAttribute("archive_type");
	
	disableSearch_form(type);
	
	switch(type)
	{
		case "mega":
		
			cat = catalog.mega;
		
		break;
		
		case "ipfs":
		
			cat = catalog.ipfs;
		
		break;
	}
	
	let archive;
	
	for(let i = 0; i < cat.archives.length; i++)
	{
		if(document.querySelectorAll("#catalog_" + type +" .tab_archive.current")[0].innerHTML === cat.archives[i].name)
		{
			archive = cat.archives[i];
			break;
		}
	}
	
	ipcRenderer.send('searchArchive', {url: archive.url, type: "all", archive_type: type, container: "archive_" + type + "_" + archive.name});
}

function show_add_archive_mega_old()
{
	document.getElementById("add_archive_box_mega").classList.remove("hidden");
}

function show_add_archive()
{
	document.getElementById(this.getAttribute("add_archive_box")).classList.remove("hidden");
}

function init_catalog_page()
{	
	let catelog_tabs = document.getElementsByClassName("tab_catalog");

	for(let i = 0; i < catelog_tabs.length; i++)
	{
		if(i === 0)
		{
			catelog_tabs[i].ariaSelected = true;
		}
		else
		{
			catelog_tabs[i].ariaSelected = false;
		}
		
		catelog_tabs[i].addEventListener('click', function(event){
			changePage_catalog(this, this.getAttribute("page_id"), "tab_catalog current", "catalog_page");
		});
	}
	
	document.getElementById("add_archive_mega").addEventListener("click", show_add_archive);
	document.getElementById("add_archive_submit_mega").addEventListener('click', addArchive);
	document.getElementById("add_archive_close_mega").addEventListener('click', closeAddarchive);
	
	document.getElementById("add_archive_ipfs").addEventListener("click", show_add_archive);
	document.getElementById("add_archive_submit_ipfs").addEventListener('click', addArchive);
	document.getElementById("add_archive_close_ipfs").addEventListener('click', closeAddarchive);
	
	document.getElementById("mega_remove_archive").addEventListener('click', removeArchive);
	
	document.getElementById("mega_search_tbx").addEventListener('keypress', function(event){
		if(event.key === 'Enter')
		{
			search_archive_func("mega");
		}
	});
	
	document.getElementById("mega_search_submit").addEventListener('click', search_archive);
	
	document.getElementById("mega_get_all").addEventListener('click', getAll_archive_res);
	
	
	
	document.getElementById("ipfs_remove_archive").addEventListener('click', removeArchive);
	
	document.getElementById("ipfs_search_tbx").addEventListener('keypress', function(event){
		if(event.key === 'Enter')
		{
			search_archive_func("ipfs");
		}
	});
	
	document.getElementById("ipfs_search_submit").addEventListener('click', search_archive);
	
	document.getElementById("ipfs_get_all").addEventListener('click', getAll_archive_res);
}