function populateHome(type, data)
{
	let results = [];
	let col = data.collection
	
	let results_buffer = [];
	
	for(let i = 0; i < col.circles.length; i++)
	{
		switch(type)
		{
			case "hgames_all":
			case "hgames_circle":
				if(type === "hgames_circle" && col.circles[i].name === data.target || type === "hgames_all")
				{
					for(let i2 = 0; i2 < col.circles[i].hgames.length; i2++)
					{
						results.push({
							name: col.circles[i].hgames[i2].name,
							icon: col.circles[i].hgames[i2].icon_path,
							exe: col.circles[i].hgames[i2].exe_path,
							circle_index: i,
							index: i2,
							type: "hgame"
						});
					}
				}
			break;
			
			case "search":
				if(col.circles[i].name.includes(data.searchTerm))
				{
					results.push({
						name: col.circles[i].name,
						icon: col.circles[i].hgames[0].icon_path,
						exe: col.circles[i].hgames[0].exe_path,
						index: i,
						type: "circle"
					});
				}
				
				if(col.circles[i].hgames.length > 0)
				{
					for(let i2 = 0; i2 < col.circles[i].hgames.length; i2++)
					{
						if(col.circles[i].hgames[i2].name.includes(data.searchTerm))
						{							
							results_buffer.push({
								name: col.circles[i].hgames[i2].name,
								icon: col.circles[i].hgames[i2].icon_path,
								exe: col.circles[i].hgames[i2].exe_path,
								circle_index: i,
								index: i2,
								type: "hgame"
							});
						}
					}
				}
			break;
			
			case "circles":
			default:
				if(col.circles[i].hgames.length === 0)
				{
					
				}
				else
				{		
					results.push({
						name: col.circles[i].name,
						icon: col.circles[i].hgames[0].icon_path,
						exe: col.circles[i].hgames[0].exe_path,
						index: i,
						type: "circle"
					});
				}
			break;
		}
	}
	
	results = results.concat(results_buffer);
	
	console.log(results);
	
	let removeContainer
	let container;
	
	if(type === "circles")
	{
		container = document.getElementById("res_cntr_circles");
		prev_container = document.getElementById("res_cntr_hgames");
	}
	else
	{
		prev_container = document.getElementById("res_cntr_circles");
		container = document.getElementById("res_cntr_hgames");
	}
	
	while(container.firstChild)
	{
		container.removeChild(container.firstChild);
	}
	
	let no_margin_index = 4;
	
	for(let i = 0; i < results.length; i++)
	{
		let result = document.createElement("DIV");
		result.classList.add("result");
		result.style.backgroundImage = 'url("' + results[i].icon + '")';
		
			let result_name = document.createElement("DIV");
			result_name.classList.add("result_name");
			result_name.innerHTML = results[i].name
			
		result.appendChild(result_name);
		
		switch(results[i].type)
		{
			case "hgame":
				
				result.setAttribute('circle_index', results[i].circle_index);
				result.setAttribute('index', results[i].index);
				
				result.addEventListener('click', function(){
					ipcRenderer.send('executeEXE', results[i].exe);
				});
				
				result.addEventListener('contextmenu', function(){
					
					populateEditForm(results[i].circle_index, results[i].index);
					
					changePage(document.getElementById("edit_tab"), "edit_page");
				});
			break;
			
			case "circle":
			
				result.setAttribute('index', results[i].index);
			
				result.addEventListener('click', function(){				
					populateHome("hgames_circle", {collection: col, target: results[i].name});
				});
			break;
		}
		
		if(type === "search" && i > 0 && results[i - 1].type !== results[i].type)
		{
			//Do section split here.
		}
		else
		{
			if(i === no_margin_index)
			{
				result.style.marginLeft = "0px";
				no_margin_index += 4;
			}
		}
		
		container.appendChild(result);	
	}
	
	prev_container.style.display = "none";
	container.style.display = "flex";
}

function initialise_home()
{
	document.getElementById("search_submit").addEventListener('click', function(){
		populateHome("search",{collection: collection, searchTerm: document.getElementById("search_val").value.trim().toLowerCase()});
		//ipcRenderer.send('searchCollection', {searchTerm: document.getElementById("search_val").value.trim()});
		document.getElementById("search_val").value = "";
	});
	
	document.getElementById("search_val").addEventListener('keypress', function(event){
		if(event.key === 'Enter')
		{
			populateHome("search",{collection: collection, searchTerm: document.getElementById("search_val").value.trim()});
			//ipcRenderer.send('searchCollection', {searchTerm: document.getElementById("search_val").value.trim()});
			
			this.value = "";
		}
	});
}