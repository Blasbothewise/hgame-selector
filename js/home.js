function populateHome(type, data)
{
	let results = [];
	let col = data.collection
	
	let results_buffer = [];
	
	switch(type)
	{
		case "random":
			
			let c_index = Math.floor(Math.random() * col.circles.length);
			
			while(col.circles[c_index].hgames.length <= 0)
			{
				c_index = Math.floor(Math.random() * col.circles.length);
			}
			
			let h_index = Math.floor(Math.random() * col.circles[c_index].hgames.length);
			
			results.push({
				name: col.circles[c_index].hgames[h_index].name,
				icon: col.circles[c_index].hgames[h_index].icon_path,
				exe: col.circles[c_index].hgames[h_index].exe_path,
				circle_index: c_index,
				index: h_index,
				type: "hgame"
			});
			
		break;
		
		default:
		
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
								let tag_match = false;
						
								for(let i3 = 0; i3 < col.circles[i].hgames[i2].tags.length; i3++)
								{
									if(col.circles[i].hgames[i2].tags[i3].toLowerCase() === data.searchTerm)
									{
										tag_match = true;
										break;
									}
								}
								
								if(col.circles[i].hgames[i2].name.includes(data.searchTerm) || tag_match === true)
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
		break;
	}
	
	results = results.concat(results_buffer);
	
	console.log(results);
	
	
	let container;
	let previousContainer;
	
	let elems = document.getElementsByClassName("results_container");
	
	for(let i = 0; i < elems.length; i++)
	{
		if(elems[i].offsetParent !== null)
		{
			previousContainer = elems[i];
			previousContainer.style.display = "none";
			break;
		}
	}
	
	if(type === "circles")
	{
		container = document.getElementById("res_cntr_circles");
	}
	else
	{
		container = document.getElementById("res_cntr_hgames");
		document.getElementById("res_back_row").style.display = "flex";
	}
	
	while(container.firstChild)
	{
		container.removeChild(container.firstChild);
	}
	
	let hgames = [];
	let circles = [];
	
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
				hgames.push(result);
			break;
			
			case "circle":
			
				result.setAttribute('index', results[i].index);
			
				result.addEventListener('click', function(){				
					populateHome("hgames_circle", {collection: col, target: results[i].name});
				});
				circles.push(result);
			break;
		}	
	}
	
	console.log(circles);
	
	if(hgames.length > 0)
	{
		let search_results_header = document.createElement("div");
		search_results_header.classList.add("search_results_header");
		search_results_header.innerHTML = "Hgames";
		container.appendChild(search_results_header);
		
		let no_margin_index = 4;
		
		for(let i = 0; i < hgames.length; i++)
		{			
			if(i === no_margin_index)
			{
				hgames[i].style.marginLeft = "0px";
				no_margin_index += 4;
			}
			
			container.appendChild(hgames[i]);
		}
	}
	
	if(circles.length > 0)
	{
		let search_results_header = document.createElement("div");
		search_results_header.classList.add("search_results_header");
		search_results_header.innerHTML = "Circles";
		container.appendChild(search_results_header);
		
		let no_margin_index = 4;
		
		for(let i = 0; i < circles.length; i++)
		{
			container.appendChild
			
			if(i === no_margin_index)
			{
				circles[i].style.marginLeft = "0px";
				no_margin_index += 4;
			}
			
			container.appendChild(circles[i]);
		}
	}
	
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
			populateHome("search",{collection: collection, searchTerm: document.getElementById("search_val").value.trim().toLowerCase()});
			//ipcRenderer.send('searchCollection', {searchTerm: document.getElementById("search_val").value.trim()});
			
			this.value = "";
		}
	});
	
	document.getElementById("random_submit").addEventListener('click', function(){
		populateHome("random",{collection: collection});
	});
	
	document.getElementById("res_back_btn").addEventListener("click", function(){
		
		document.getElementById("res_cntr_hgames").style.display = "none";
		document.getElementById("res_cntr_circles").style.display = "flex";
		this.parentNode.style.display = "none";
	});
}