

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

function init_mega_tabs()
{
	let mega_tabs = document.getElementsByClassName("tab_mega");

	for(let i = 0; i < mega_tabs.length; i++)
	{
		if(i === 0)
		{
			mega_tabs[i].ariaSelected = true;
		}
		else
		{
			mega_tabs[i].ariaSelected = false;
		}
		
		mega_tabs[i].addEventListener('click', function(event){
			changePage(this, this.getAttribute("page_id"), "tab_mega", "archive_page");
		});
	}
}

function closeAddarchiveMenu()
{
	this.parentNode.parentNode.style.display = "none";
}

function enable_mega_add_archive()
{
	let mega_close = document.getElementById("add_mega_close");
	mega_close.classList.toggle("disabled");
	mega_close.addEventListener('click', closeAddarchiveMenu);
	
	let url = document.getElementById("add_mega_tbx_url");
	url.disabled = false;
	
	document.getElementById("add_mega_tbx_name").disabled = false;
	
	let sub_btn = document.getElementById("add_archive_mega_submit");
	
	sub_btn.addEventListener('click', addMegaArchive);
	sub_btn.classList.toggle("disabled");
}

function addMegaArchive()
{
	let elem = this;
	
	let mega_close = document.getElementById("add_mega_close");
	mega_close.classList.toggle("disabled");
	mega_close.removeEventListener('click', closeAddarchiveMenu);
	
	let url = document.getElementById("add_mega_tbx_url");
	url.disabled = true;
	
	let name = document.getElementById("add_mega_tbx_name");
	name.disabled = true;
	
	this.removeEventListener('click', addMegaArchive);
	this.classList.toggle("disabled");
	
	ipcRenderer.send('addMegaArchive', {url: url.value.trim(), name: name.value.trim()});
}

function addMegaArchivePage(archive)
{
	let tab_mega = document.createElement("DIV");
	tab_mega.innerHTML = archive.name;
	tab_mega.classList.add("tab_mega");
	tab_mega.id = "catalog_tab_" + archive.name;
	tabs_mega.setAttribute("page_id", "archive_" + archive.name);
	tabs_mega.setAttribute("url", archive.url);
	tabs_mega.ariaSelected = false;
	
	let tabs_box = document.getElementById("tabs_mega");
	tabs_box.insertBefore(tab_mega, tabs_box.children[tabs_box_mega.children.length - 1])
	
	let archive_page = document.createElement("DIV");
	archive_page.classList.add("archive_page");
	archive_page.classList.add("hidden");
	archive_page.id = "archive_" + archive.name;
	
	enable_mega_add_archive();
	document.getElementById("add_archive_mega_box").classList.add("hidden");
}

function populateCatalog()
{
	if(catalog.mega.archives.length > 0)
	{
		document.getElementById("mega_search_cntr").style.display = "flex";
		
		let tabs_box_mega = document.getElementById("tabs_mega");
		
		for(let i = 0; i < catalog.mega.archives.length; i++)
		{
			
			let tab_mega = document.createElement("DIV");
			tab_mega.innerHTML = catalog.mega.archives[i].name;
			tab_mega.classList.add("tab_mega");
			tab_mega.id = "catalog_tab_" + catalog.mega.archives[i].name;
			tabs_mega.setAttribute("page_id", "archive_" + catalog.mega.archives[i].name);
			tabs_mega.setAttribute("url", catalog.mega.archives[i].url);
			
			let archive_page = document.createElement("DIV");
			archive_page.classList.add("archive_page");
			archive_page.id = "archive_" + catalog.mega.archives[i].name;
			
			enable_mega_add_archive();
			
			if(i === 0)
			{
				tab_mega.classList.add("current");
				tabs_mega.ariaSelected = true;
			}
			else
			{
				tabs_mega.ariaSelected = false;
				document.getElementById("add_archive_mega_box").classList.add("hidden");
				archive_page.classList.add("hidden");
			}
			
			tabs_box_mega.insertBefore(tab_mega, tabs_box_mega.children[tabs_box_mega.children.length - 1])
			document.getElementById("catelog_mega").appendChild(archive_page);
		}
	}
}

function downloadHgameMega()
{
	if(downloads_count < 5)
	{	
		this.removeEventListener("click", downloadHgameMega);
		this.classList.toggle("archive_result_btn_disabled");
		
		
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

function populate_mega_archive(results, container)
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
		
		let tags = ""
		let tags_string = "";
		
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
				archive_result_btn.addEventListener('click', downloadHgameMega);
			
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

function enableSearch_form_mega()
{
	document.getElementById("mega_search_tbx").disabled = false;
	let sub_btn = document.getElementById("mega_search_submit");
	sub_btn.classList.toggle("page_search_btn_disabled");
	sub_btn.addEventListener('click', search_archive_mega);
	
	let all_btn = document.getElementById("mega_get_all")
	all_btn.classList.toggle("page_search_btn_disabled");
	all_btn.addEventListener('click', getAll_archive_res_mega);
}

function disableSearch_form_mega()
{
	document.getElementById("mega_search_tbx").disabled = true;
	let sub_btn = document.getElementById("mega_search_submit");
	sub_btn.classList.toggle("page_search_btn_disabled");
	sub_btn.removeEventListener('click', search_archive_mega);
	
	let all_btn = document.getElementById("mega_get_all")
	all_btn.classList.toggle("page_search_btn_disabled");
	all_btn.removeEventListener('click', getAll_archive_res_mega);
}

function search_archive_mega()
{
	
}

function getAll_archive_res_mega()
{
	disableSearch_form_mega();
	
	let archive;
	
	for(let i = 0; i < catalog.mega.archives.length; i++)
	{
		if(document.getElementsByClassName("tab_mega current")[0].innerHTML === catalog.mega.archives[i].name)
		{
			archive = catalog.mega.archives[i];
			break;
		}
	}
	
	ipcRenderer.send('searchMegaArchive', {url: archive.url, type: "all", container: "archive_" + archive.name});
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
			changePage(this, this.getAttribute("page_id"), "tab_catalog", "catalog_page");
		});
	}
	
	document.getElementById("add_mega_close").addEventListener('click', closeAddarchiveMenu);
	
	document.getElementById("add_archive_mega_submit").addEventListener('click', addMegaArchive);
	
	document.getElementById("add_archive_mega").addEventListener("click", function(){
		document.getElementById("add_archive_mega_box").style.display = "flex";
	});
	
	document.getElementById("mega_search_submit").addEventListener('click', search_archive_mega);
	document.getElementById("mega_get_all").addEventListener('click', getAll_archive_res_mega);
}