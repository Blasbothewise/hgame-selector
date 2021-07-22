
function scanDirForHgames()
{
	this.removeEventListener('click', scanDirForHgames);
	this.classList.toggle("batch_btn_disabled");
	
	let sel = document.getElementById("batch_dir_select");
	sel.removeEventListener('click', directory_dialog_batch);
	sel.classList.toggle("batch_btn_disabled");
	
	ipcRenderer.send('scanForHgames', document.getElementById("batch_tbx").value);
}

function enable_batch_form()
{
	let sub = document.getElementById("batch_dir_scan");
	sub.addEventListener('click', scanDirForHgames);
	sub.classList.toggle("batch_btn_disabled");
	let sel = document.getElementById("batch_dir_select")
	sel.addEventListener('click', directory_dialog_batch);
	sel.classList.toggle("batch_btn_disabled");
}

function enable_batch_results()
{
	let results = document.getElementByClass("batch_result");
	
	for(let i = 0; i < results.length; i++)
	{	
		let remove_btn = results[i].children[results[i].children.length - 1];
		remove_btn.addEventListener('click', removeResult);
		remove_btn.classList.toggle("batch_result_btn_diabled");
	}
}

function clear_batch_results()
{
	let cntr = document.getElementById("batch_results_cntr");
	
	while(cntr.firstChild)
	{
		cntr.removeChild(cntr.firstChild);
	}
	
	let sub = document.getElementById("batch_submit");
	sub.removeEventListener('click', submitBatch);
	sub.classList.remove("batch_submit");
	sub.classList.add("batch_submit_disabled");

}

function submitBatch()
{
	let results = document.getElementsByClassName("batch_result");
	
	let hgames = [];
	
	let valError = false;
	
	for(let i = 0; i < results.length; i++)
	{
		let elems = [
			results[i].children[0].children[0].children[0], // name
			results[i].children[0].children[1].children[0], //circle
			results[i].children[0].children[2].children[0], //exe path
			results[i].children[0].children[2].children[1] //icon path
		];
		
		for(let i2 = 0; i2 < elems.length; i2++)
		{
			if(elems[i2].value.trim() === "")
			{
				elems[i2].style.borderColor = "red";
				valError = true;
			}
			else
			{
				elems[i2].style.borderColor = "white";
			}
		}
		
	}
	
	if(valError === false)
	{
		console.log("shablah");
		
		for(let i = 0; i < results.length; i++)
		{
			let hgame = {};
			
			hgame.name = results[i].children[0].children[0].children[0].value.trim().toLowerCase();
			hgame.jp_name = results[i].children[0].children[0].children[1].value.trim().toLowerCase();
			hgame.circle = results[i].children[0].children[1].children[0].value.trim().toLowerCase();
			hgame.exe_path = results[i].children[0].children[2].children[0].value.trim() + "/" + results[i].children[0].children[3].value;
			hgame.icon_path = results[i].children[0].children[2].children[1].value;
			
			hgame.tags = results[i].children[1].children[0].children[0].value.split("£");
			
			if(hgame.tags[0] === "")
			{
				hgame.tags = [];
			}
			
			hgames.push(hgame);
			
			let remove_btn = results[i].children[1].children[results[i].children[1].children.length - 1];
			remove_btn.removeEventListener('click', removeResult);
			remove_btn.classList.toggle("batch_result_btn_diabled");
		}
		
		console.log(hgames);
		
		ipcRenderer.send('batchAddHgames', hgames);
		
		this.removeEventListener('click', submitBatch);
		this.classList.remove("batch_submit");
		this.classList.add("batch_submit_disabled");
	}
}

function directory_dialog_batch()
{
	function directory_dialog_res(event, args)
	{
		if(args.status === "success")
		{
			console.log(args);
			if(args.data !== undefined)
			{
				document.getElementById("batch_tbx").value = args.data;
			}
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
		
		let dialog_btn = document.getElementById("batch_dir_select");
		dialog_btn.classList.remove("batch_btn_disabled");
		dialog_btn.addEventListener('click', directory_dialog_batch);
		
		ipcRenderer.removeListener('getFilePath_res', directory_dialog_res);
	}
	
	ipcRenderer.on('getFolderPath_res', directory_dialog_res);
	
	ipcRenderer.send('getFolderPath', "batch_dir");
	
	this.removeEventListener('click', directory_dialog_batch);
	this.classList.add("batch_btn_disabled");
}

function file_dialog_batch()
{	
	let elem = this;

	function file_dialog_batch_res(event, args)
	{
		if(args.status === "success")
		{
			console.log(args);
			
			let value = args.data;
			
			elem.parentNode.previousSibling.children[2].children[1].value = value;
			elem.previousSibling.style.backgroundImage = 'url("' + value.replaceAll("\\", "/") + '")';
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}

		elem.addEventListener('click', file_dialog_batch);
		elem.classList.toggle("batch_result_btn_diabled");
		
		ipcRenderer.removeListener('getFilePath_res', file_dialog_batch_res);
	}

	ipcRenderer.on('getFilePath_res', file_dialog_batch_res);
	
	ipcRenderer.send('getFilePath');
	
	elem.removeEventListener('click', file_dialog_batch);
	elem.classList.toggle("batch_result_btn_diabled");
}

function init_batch_Page()
{
	let tab = document.getElementById("batch_tab");

	tab.addEventListener('click', function(event){
		
		console.log(tab.ariaSelected);
		
		if(tab.ariaSelected === 'true')
		{
			
		}
		else
		{
			clear_batch_results();
		}
	});
	
	document.getElementById("batch_dir_select").addEventListener('click', directory_dialog_batch);
	
	document.getElementById("batch_dir_file").addEventListener("change", function()
	{
		console.log(this.value);
		console.log("bosh");
		
		document.getElementById("batch_tbx").value = this.files[0].path;
		this.value = "";
	});
	
	document.getElementById("batch_dir_scan").addEventListener('click', scanDirForHgames);
	
	document.getElementById("batch_dir_clear").addEventListener('click', clear_batch_results);
}

function removeResult()
{
	this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode);
}

function add_tag_import_elem(elem, value)
{	
	value = value.trim().toLowerCase();
	
	if(value !== "")
	{
		let add_edit_tag = document.createElement("DIV");
		add_edit_tag.classList.add("add_edit_tag");
		add_edit_tag.innerHTML = value;
		
		let container = elem;
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
}

function populateBatch(results)
{
	console.log(results[0].import_scrape);
	
	let results_cntr = document.getElementById("batch_results_cntr");
	
	console.log("hgames found: " + results.length);
	
	for(let i = 0; i < results.length; i++)
	{
		let name;
		let jp_name;
		let icon;
		let circle;
		let tags = [];
		
		switch(results[i].app.type)
		{
			case "dlsite":
				name = results[i].import_scrape.name.name;
				jp_name = results[i].import_scrape.jp_name;
				icon = results[i].import_scrape.icon;
				circle = results[i].import_scrape.brand.name;
				
				for(let i2 = 0; i2 < results[i].import_scrape.product_metadata.Genre.items.length; i2++)
				{
					tags.push(results[i].import_scrape.product_metadata.Genre.items[i2].trim());
				}
			break
		}
		
		let batch_result = document.createElement("DIV");
		batch_result.classList.add("batch_result");
		
			let batch_result_row_1 = document.createElement("DIV");
			batch_result_row_1.classList.add("batch_result_row");
		
				let batch_res_col_1 = document.createElement("DIV");
				batch_res_col_1.classList.add("batch_res_col_1");
					let batch_tbx_name = document.createElement("input");
					batch_tbx_name.classList.add("batch_res_tbx");
					batch_tbx_name.value = name
					
					let batch_tbx_jp_name = document.createElement("input");
					batch_tbx_jp_name.classList.add("batch_res_tbx");
					batch_tbx_jp_name.value = jp_name
					
				batch_res_col_1.appendChild(batch_tbx_name);
				batch_res_col_1.appendChild(batch_tbx_jp_name);
				
				let batch_res_col_2 = document.createElement("DIV");
				batch_res_col_2.classList.add("batch_res_col_2");
				
					let batch_tbx_circle = document.createElement("input");
					batch_tbx_circle.classList.add("batch_res_tbx");
					batch_tbx_circle.value = circle
				
				batch_res_col_2.appendChild(batch_tbx_circle);
				
				let batch_res_col_3 = document.createElement("DIV");
				batch_res_col_3.classList.add("batch_res_col_3");
				
					let batch_tbx_dir_name = document.createElement("input");
					batch_tbx_dir_name.classList.add("batch_res_tbx");
					batch_tbx_dir_name.value = results[i].app.dir_name;
					
					let batch_tbx_icon = document.createElement("input");
					batch_tbx_icon.classList.add("batch_res_tbx");
					batch_tbx_icon.value = icon
					
				batch_res_col_3.appendChild(batch_tbx_dir_name);
				batch_res_col_3.appendChild(batch_tbx_icon);
				
				let batch_result_exe = document.createElement("SELECT");
				batch_result_exe.classList.add("batch_result_exe");
				
					for(let i2 = 0; i2 < results[i].app.exes.length; i2++)
					{
						let opt = document.createElement("OPTION");
						opt.value = results[i].app.exes[i2];
						opt.innerHTML = results[i].app.exes[i2];
						opt.classList.add("batch_result_exe_opt");
						batch_result_exe.appendChild(opt);
					}
					
				batch_result_exe.selectedIndex = 0;
				
				let batch_result_btn_1 = document.createElement("DIV");
				batch_result_btn_1.classList.add("batch_result_btn");
				batch_result_btn_1.classList.add("remove");
				batch_result_btn_1.innerHTML = "remove";
				batch_result_btn_1.addEventListener('click', removeResult);
				
			batch_result_row_1.append(batch_res_col_1);
			batch_result_row_1.append(batch_res_col_2);
			batch_result_row_1.append(batch_res_col_3);
			batch_result_row_1.append(batch_result_exe);
			batch_result_row_1.append(batch_result_btn_1);
			
			let batch_result_row_2 = document.createElement("DIV");
			batch_result_row_2.classList.add("batch_result_row");
			
				let batch_res_tags_col = document.createElement("DIV")
				batch_res_tags_col.classList.add("batch_res_tags_col");
				
					let batch_result_tags = document.createElement("DIV")
					batch_result_tags.classList.add("batch_result_tags");
					
						for(let i2 = 0; i2 < tags.length; i2++)
						{
							add_tag_import_elem(batch_result_tags, tags[i2]);
						}
				
				let batch_result_tags_tbx = document.createElement("input")
				batch_result_tags_tbx.placeholder = "a tag";
				batch_result_tags_tbx.classList.add("batch_result_tags_tbx");
				batch_result_tags_tbx.addEventListener('keypress', function(event){
					if(event.key === 'Enter')
					{
						add_tag_import_elem(batch_result_tags, this.previousSibling.value);
						this.value = "";
					}
				});
				
				let batch_result_tags_add = document.createElement("DIV")
				batch_result_tags_add.classList.add("batch_result_tags_add"); 
				batch_result_tags_add.innerHTML = "add";
				batch_result_tags_add.addEventListener('click', function(){
					add_tag_import_elem(batch_result_tags, this.previousSibling.value);
					this.previousSibling.value = "";
				});
				
				batch_res_tags_col.appendChild(batch_result_tags);
				batch_res_tags_col.appendChild(batch_result_tags_tbx);
				batch_res_tags_col.appendChild(batch_result_tags_add);
				
				let batch_res_icon = document.createElement("DIV")
				batch_res_icon.classList.add("batch_res_icon");
				batch_res_icon.style.backgroundImage = 'url("' + icon + '")';
				
				let batch_result_btn_2 = document.createElement("DIV")
				batch_result_btn_2.classList.add("batch_result_btn"); 
				batch_result_btn_2.innerHTML = "set icon";
				batch_result_btn_2.addEventListener('click', file_dialog_batch);
				
			batch_result_row_2.appendChild(batch_res_tags_col);
			batch_result_row_2.appendChild(batch_res_icon);
			batch_result_row_2.appendChild(batch_result_btn_2);
		
		batch_result.appendChild(batch_result_row_1);
		batch_result.appendChild(batch_result_row_2);
		
		results_cntr.appendChild(batch_result);
	}
	
	enable_batch_form();
	
	let sub = document.getElementById("batch_submit");
	sub.addEventListener('click', submitBatch);
	sub.classList.remove("batch_submit_disabled");
	sub.classList.add("batch_submit");
	
}