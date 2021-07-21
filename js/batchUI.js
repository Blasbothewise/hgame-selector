
function scanDirForHgames()
{
	this.removeEventListener('click', scanDirForHgames);
	document.getElementById("batch_dir_select").removeEventListener('click', file_dialog);
	
	ipcRenderer.send('scanForHgames', document.getElementById("batch_tbx").value);
}

function enable_batch_form()
{
	document.getElementById("batch_dir_scan").addEventListener('click', scanDirForHgames);
	document.getElementById("batch_dir_select").addEventListener('click', file_dialog);
}

const {dialog} = require('electron')

function file_dialog_2()
{
	ipcRenderer.send('getFolderPath', "batch_dir");
}

function init_batch_Page()
{
	document.getElementById("batch_dir_select").addEventListener('click', file_dialog_2);
	
	document.getElementById("batch_dir_file").addEventListener("change", function()
	{
		console.log(this.value);
		console.log("bosh");
		
		document.getElementById("batch_tbx").value = this.files[0].path;
		this.value = "";
	});
	
	document.getElementById("batch_dir_scan").addEventListener('click', scanDirForHgames);
}

function populateBatch(results)
{
	console.log(results[0].import_scrape);
	
	let results_cntr = document.getElementById("batch_results_cntr");
	
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
				circle = results[i].import_scrape.brand.name;;
				
				for(let i2 = 0; i2 < results[i].import_scrape.product_metadata.Genre.items.length; i2++)
				{
					tags.push(results[i].import_scrape.product_metadata.Genre.items[i2].trim());
				}
			break
		}
		
		let batch_opt_row = document.createElement("DIV");
		batch_opt_row.classList.add("batch_opt_row");
		
			let batch_name = document.createElement("DIV");
			batch_name.classList.add("batch_name");
			batch_name.innerHTML = name;
			
			let batch_circle = document.createElement("DIV");
			batch_circle.classList.add("batch_circle");
			batch_circle.innerHTML = circle;
			
			let batch_hgame_dir = document.createElement("DIV");
			batch_hgame_dir.classList.add("batch_hgame_dir");
			batch_hgame_dir.innerHTML = results[i].app.dir_name;
			
			let batch_result_exe = document.createElement("SELECT");
			batch_result_exe.classList.add("batch_result_exe");
			
				for(let i2 = 0; i2 < results[i].app.exes.length; i2++)
				{
					let opt = document.createElement("OPTION");
					opt.value = results[i].app.exes[i2];
					opt.innerHTML = results[i].app.exes[i2];
					batch_result_exe.appendChild(opt);
				}
			batch_result_exe.selectedIndex = 0;
			
			let batch_result_remove = document.createElement("DIV");
			batch_result_remove.classList.add("batch_result_remove");
			batch_result_remove.innerHTML = "remove";
			
		batch_opt_row.append(batch_name);
		batch_opt_row.append(batch_circle);
		batch_opt_row.append(batch_hgame_dir);
		batch_opt_row.append(batch_result_exe);
		batch_opt_row.append(batch_result_remove);
		
		results_cntr.appendChild(batch_opt_row);
	}
}