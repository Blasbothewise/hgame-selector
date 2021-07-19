function addHgame()
{
	let elems = [
		document.getElementById("add_name"),
		document.getElementById("add_jp_name"),
		document.getElementById("add_exe"),
		document.getElementById("add_icon"),
		document.getElementById("add_circle"),
		document.getElementById("add_tags_box"),
	];
	
	let valError = false;
	
	for(let i = 0; i < elems.length; i++)
	{
		if(elems[i].value.trim() === "")
		{
			elems[i].style.borderColor = "red";
			valError = true;
		}
		else
		{
			elems[i].borderColor = "white";
		}
	}
	
	if(valError === false)
	{
		let Hgame = {
			name: document.getElementById("add_name").value.trim().toLowerCase(),
			jp_name: document.getElementById("add_jp_name").value.trim().toLowerCase(),
			exe_path: document.getElementById("add_exe").value.trim(),
			icon_path: document.getElementById("add_icon").value.trim(),
			circle: document.getElementById("add_circle").value.toLowerCase(),
			tags: document.getElementById("add_tags_box").value.split("£"),
		};
		
		ipcRenderer.send('addHgame', Hgame);
	}
}

function import_VNDB(url_elem)
{
	ipcRenderer.send('import_VNDB', url_elem.value.trim());
}

function import_DLsite(url_elem)
{
	ipcRenderer.send('scrape_dlsite', url_elem.value.trim());
}

function add_tag_import(cntr_id, value)
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

function populateDlsiteData(data)
{	
	document.getElementById("add_name").value = data.name.name;
	document.getElementById("add_jp_name").value = data.jp_name;
	document.getElementById("add_icon").value = data.icon;
	document.getElementById("add_icon_display").style.backgroundImage = 'url("' + data.icon + '")';
	
	document.getElementById("add_circle").value = data.brand.name;
	
	//add tags loop
	
	for(let i = 0; i < data.product_metadata.Genre.items.length; i++)
	{
		add_tag_import("add_tags_box", data.product_metadata.Genre.items[i].trim());
	}
	
	document.getElementById("add_dlsite_import_menu").style.display = "none";
}

function clearAddForm()
{	
	document.getElementById("add_name").value = null;
	document.getElementById("add_jp_name").value = null;
	document.getElementById("add_exe").value = null;
	document.getElementById("add_icon").value = null;
	document.getElementById("add_icon_display").style.backgroundImage = null;
	
	document.getElementById("add_circle").value = null;
	document.getElementById("add_tags_input").value = null;
	
	let tags_box = document.getElementById("add_tags_box");
	tags_box.value = "";
	while(tags_box.firstChild)
	{
		tags_box.removeChild(tags_box.firstChild);
	}
}

function disable_inport_form(elem)
{	
	if(elem.nodeName === "INPUT")
	{
		elem.disabled = true;
	}
	else
	{
		elem.classList.remove("add_import_menu_submit");
		elem.classList.add("add_import_menu_submit_disabled");
		elem.removeEventListener('click', import_submit);
	}
	
	let sibling = document.getElementById(elem.getAttribute("sibling"));
	
	if(sibling.nodeName === "INPUT")
	{
		sibling.disabled = true;
	}
	else
	{
		sibling.classList.remove("add_import_menu_submit");
		sibling.classList.add("add_import_menu_submit_disabled");
		sibling.removeEventListener('click', import_submit);
	}
}

function enable_import_form(elem)
{
	if(elem.nodeName === "INPUT")
	{
		elem.disabled = false;
	}
	else
	{
		elem.classList.remove("add_import_menu_submit_disabled");
		elem.classList.add("add_import_menu_submit");
		elem.addEventListener('click', import_submit);
	}
	
	let sibling = document.getElementById(elem.getAttribute("sibling"));
	
	if(sibling.nodeName === "INPUT")
	{
		sibling.disabled = false;
	}
	else
	{
		sibling.classList.remove("add_import_menu_submit_disabled");
		sibling.classList.add("add_import_menu_submit");
		sibling.addEventListener('click', import_submit);
	}
}

function import_submit()
{
	window[this.getAttribute("func")](this.previousElementSibling.firstChild);
	
	disable_inport_form(this);
}

function init_Add_Page()
{
	let tab = document.getElementById("add_tab");

	tab.addEventListener('click', function(event){
		
		console.log(tab.ariaSelected);
		
		if(tab.ariaSelected === 'true')
		{
			
		}
		else
		{
			clearAddForm();
		}
	});
	
	let import_opts = document.getElementsByClassName("add_import_opt");
	
	for(let i = 0; i < import_opts.length; i++)
	{
		import_opts[i].addEventListener('click', function(){
			let menus = document.getElementsByClassName("add_import_menu");
			
			for(let i2 = 0; i2 < menus.length; i2++)
			{
				menus[i2].style.display = "none";
			}
			
			document.getElementById(this.getAttribute("menu_id")).style.display = "flex";
		});
	}
	
	let submit_btns = document.getElementsByClassName("add_import_menu_submit");
	
	for(let i = 0; i < submit_btns.length; i++)
	{
		submit_btns[i].addEventListener('click', import_submit);
	}
	
	let close_btns = document.getElementsByClassName("add_import_menu_close");
	
	for(let i = 0; i < close_btns.length; i++)
	{
		close_btns[i].addEventListener('click', function(){
			this.parentNode.style.display = "none";
		});
	}
	
	document.getElementById("add_tags_input_btn").addEventListener('click', function(event){
		add_tag("add_tags_input", "add_tags_box");
	});
	
	document.getElementById("add_tags_input").addEventListener('keypress', function(event){
		if(event.key === 'Enter')
		{
			add_tag("add_tags_input", "add_tags_box");
		}
	});
	
	document.getElementById("add_exe_file").addEventListener("change", function()
	{
		document.getElementById("add_exe").value = this.files[0].path;
		this.value = "";
	});
	
	document.getElementById("add_exe_btn").addEventListener('click', file_dialog);
	
	document.getElementById("add_icon_file").addEventListener("change", function()
	{
		console.log(this.files[0].path);
		
		document.getElementById("add_icon").value = this.files[0].path;
		document.getElementById("add_icon_display").style.backgroundImage = 'url("' + this.files[0].path + '")';
		this.value = "";
	});
	
	document.getElementById("add_icon_btn").addEventListener('click', file_dialog);
	
	document.getElementById("add_submit").addEventListener('click', addHgame);
}