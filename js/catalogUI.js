
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

function enable_add_archive(type)
{
	let add_close = document.getElementById("add_archive_close_" + type);
	add_close.classList.remove("disabled");
	add_close.addEventListener('click', closeAddarchive);
	
	let url = document.getElementById("add_archive_url_" + type);
	url.disabled = false;
	
	document.getElementById("add_archive_name_" + type).disabled = false;
	
	let sub_btn = document.getElementById("add_archive_submit_" + type);
	
	sub_btn.addEventListener('click', addArchive);
	sub_btn.classList.remove("disabled");
}

function removeArchive()
{
	console.log(this);
	
	let page = this.parentNode.parentNode;
	let idSplit = page.id.split("_");
	
	let tab = document.getElementById("catalog_tab_" + idSplit[1] + "_" + idSplit[2]);
	
	this.classList.add("disabled");
	this.removeEventListener("click", removeArchive);
	
	ipcRenderer.send('removeArchive', {url: tab.getAttribute("url"), type: idSplit[1]});
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
	
	if(tabs.length >= 2)
	{
		tabs[0].ariaSelected = true;
		tabs[0].classList.add("current");
		document.getElementById(tabs[0].getAttribute("page_id")).classList.remove("hidden");
	}
}

function enableRemoveArchive(url, type)
{
	let tabs = document.querySelectorAll("#catalog_" + type + " .tab_archive");
	
	for(let i = 0; i < tabs.length; i++)
	{
		if(tabs[i].getAttribute("url") === url)
		{
			let btn = document.getElementById(tabs[i].getAttribute("page_id")).querySelector(".search_row .page_search_btn.archive_rmv");
			btn.classList.remove("disabled");
			btn.addEventListener("click", removeArchive);
		}
	}
}

function populateCatalog()
{
	if(catalog.mega.archives.length > 0)
	{
		for(let i = 0; i < catalog.mega.archives.length; i++)
		{
			addArchivePage( catalog.mega.archives[i], "mega");
		}
	}
	
	if(catalog.ipfs.archives.length > 0)
	{
		for(let i = 0; i < catalog.ipfs.archives.length; i++)
		{
			addArchivePage( catalog.ipfs.archives[i], "ipfs");
		}
	}
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
	
		search_row = document.createElement("DIV");
		search_row.classList.add("search_row");
		search_row.classList.add("archive");
		
			search_tbx_cntr = document.createElement("DIV");
			search_tbx_cntr.classList.add("search_tbx_cntr");
				
				search_tbx = document.createElement("input");
				search_tbx.classList.add("search_tbx");
				search_tbx.placeholder = "Search " + archive.name;
				search_tbx.addEventListener('keypress', function(event){
					if(event.key === 'Enter')
					{
						search_archive(event.target);
					}
				});
				
			search_tbx_cntr.appendChild(search_tbx);
			
			page_search_btn = document.createElement("DIV");
			page_search_btn.classList.add("page_search_btn");
			page_search_btn.innerHTML = "search";
			page_search_btn.addEventListener('click', search_archive);
			
			page_search_btn_2 = document.createElement("DIV");
			page_search_btn_2.classList.add("page_search_btn");
			page_search_btn_2.innerHTML = "get all";
			page_search_btn_2.setAttribute('searchType', 'all');
			page_search_btn_2.addEventListener('click', search_archive);
			
			search_spacer = document.createElement("DIV");
			search_spacer.classList.add("search_spacer");
			
			page_search_btn_3 = document.createElement("DIV");
			page_search_btn_3.classList.add("page_search_btn");
			page_search_btn_3.classList.add("archive_rmv");
			page_search_btn_3.innerHTML = "remove archive";
			page_search_btn_3.addEventListener('click', removeArchive);
	
		search_row.appendChild(search_tbx_cntr);
		search_row.appendChild(page_search_btn);
		search_row.appendChild(page_search_btn_2);
		search_row.appendChild(search_spacer);
		search_row.appendChild(page_search_btn_3);
		
		archive_page_results = document.createElement("DIV");
		archive_page_results.classList.add("archive_page_results");
		
	archive_page.appendChild(search_row);
	archive_page.appendChild(archive_page_results);
	
	if(document.querySelectorAll("#catalog_" + type + " .tab_archive").length === 1)
	{
		tab_archive.ariaSelected = true;
		tab_archive.classList.add("current");
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

function show_add_archive()
{
	document.getElementById(this.getAttribute("add_archive_box")).classList.remove("hidden");
}

function closeAddarchive()
{
	this.parentNode.parentNode.classList.add("hidden");
	document.getElementById(this.getAttribute("show_btn")).addEventListener("click", show_add_archive);
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

function search_archive(target)
{	
	let archive_page = (typeof target.parentNode === 'undefined') ? this.parentNode.parentNode : target.parentNode.parentNode.parentNode;
	
	let idSplit = archive_page.id.split('_');
	
	disableSearch_form(archive_page.id);
	
	let cat;
	
	switch(idSplit[1])
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
		if(idSplit[2] === cat.archives[i].name)
		{
			archive = cat.archives[i];
			break;
		}
	}
	
	ipcRenderer.send('searchArchive', {url: archive.url, type: (this.getAttribute("searchType") === "all") ? "all" : "search", searchTerm: archive_page.querySelector("div.search_row.archive > div.search_tbx_cntr > input").value.trim(), archive_type: idSplit[1], container: archive_page.id});
}

function populate_archive(results, container, type)
{
	let res_cntr = document.getElementById(container).childNodes[1];
	
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

function enableSearch_form(container)
{
	document.querySelector("#" + container + " > div.search_row.archive > div.search_tbx_cntr > input").disabled = false;
	
	let btns = document.querySelectorAll("#" + container + " .page_search_btn");
	
	btns[0].classList.toggle("disabled");
	btns[0].addEventListener('click', search_archive);
	btns[1].classList.toggle("disabled");
	btns[1].addEventListener('click', search_archive);
	btns[2].classList.toggle("disabled");
	btns[2].removeEventListener('click', removeArchive);
}

function disableSearch_form(container)
{	
	document.querySelector("#" + container + " .search_tbx").disabled = true;
	let btns = document.querySelectorAll("#" + container + " .page_search_btn");
	
	btns[0].classList.toggle("disabled");
	btns[0].removeEventListener('click', search_archive);
	btns[1].classList.toggle("disabled");
	btns[1].removeEventListener('click', search_archive);
	btns[2].classList.toggle("disabled");
	btns[2].removeEventListener('click', removeArchive);
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
}