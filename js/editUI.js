function removeHgame()
{
	console.log("foog");
	
	let submit_btn = document.getElementById("remove_submit");
	ipcRenderer.send('removeHgame', {circle_index: submit_btn.getAttribute("circle_index"), hgame_index: submit_btn.getAttribute("hgame_index")});
}

function editHgame()
{
	let elems = [
		document.getElementById("edit_name"),
		document.getElementById("edit_jp_name"),
		document.getElementById("edit_exe"),
		document.getElementById("edit_icon"),
		document.getElementById("edit_circle"),
		document.getElementById("edit_tags_box"),
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
			name: document.getElementById("edit_name").value.trim().toLowerCase(),
			jp_name: document.getElementById("edit_jp_name").value.trim().toLowerCase(),
			exe_path: document.getElementById("edit_exe").value.trim(),
			icon_path: document.getElementById("edit_icon").value.trim(),
			circle: document.getElementById("edit_circle").value.toLowerCase(),
			tags: document.getElementById("edit_tags_box").value.split("£"),
		};
		
		let submit_btn = document.getElementById("edit_submit");
		
		ipcRenderer.send('editHgame', { hgame: Hgame, circle_index: submit_btn.getAttribute("circle_index"), hgame_index: submit_btn.getAttribute("hgame_index")});
	}
}

function populateEditForm(circle_index, origin_index)
{
	clearEditForm();
	
	let hgame = collection.circles[circle_index].hgames[origin_index]; 
	
	document.getElementById("edit_name").value = hgame.name;
	document.getElementById("edit_jp_name").value = hgame.jp_name;
	document.getElementById("edit_exe").value = hgame.exe_path;
	document.getElementById("edit_icon").value = hgame.icon_path;
	
	document.getElementById("edit_icon_display").style.backgroundImage = 'url("' + hgame.icon_path + '")';
	
	document.getElementById("edit_circle").value = collection.circles[circle_index].name;
	
	for(let i = 0; i < hgame.tags.length; i++)
	{
		add_tag_import("edit_tags_box", hgame.tags[i]);
	}
	
	let submit_btn = document.getElementById("edit_submit");
	submit_btn.setAttribute('circle_index', circle_index);
	submit_btn.setAttribute('hgame_index', origin_index);
	
	let remove_submit = document.getElementById("remove_submit");
	remove_submit.setAttribute('circle_index', circle_index);
	remove_submit.setAttribute('hgame_index', origin_index);

	enableEditForm();
}

function clearEditForm()
{
	document.getElementById("edit_name").value = null;
	document.getElementById("edit_jp_name").value = null;
	document.getElementById("edit_exe").value = null;
	document.getElementById("edit_icon").value = null;
	document.getElementById("edit_icon_display").style.backgroundImage = null;
	
	document.getElementById("edit_circle").value = null;
	document.getElementById("edit_tags_input").value = null;
	
	let tags_box = document.getElementById("edit_tags_box");
	tags_box.value = "";
	while(tags_box.firstChild)
	{
		tags_box.removeChild(tags_box.firstChild);
	}

	disableEditForm();
}

function enableEditForm()
{
	document.getElementById("edit_name").disabled = false;
	document.getElementById("edit_jp_name").disabled = false;
	
	let exe_btn = document.getElementById("edit_exe_btn");
	exe_btn.classList.remove("add_edit_input_btn_plus_disabled");
	exe_btn.classList.add("add_edit_input_btn_plus");
	exe_btn.addEventListener('click', file_dialog);
	
	let icon_btn = document.getElementById("edit_icon_btn");
	icon_btn.classList.remove("add_edit_input_btn_plus_disabled");
	icon_btn.classList.add("add_edit_input_btn_plus");
	icon_btn.addEventListener('click', file_dialog);
	
	document.getElementById("edit_circle").disabled = false;
	document.getElementById("edit_tags_input").disabled = false;
	
	let tags_input_btn = document.getElementById("edit_tags_input_btn");
	tags_input_btn.classList.remove("add_edit_input_btn_disabled");
	tags_input_btn.classList.add("add_edit_input_btn");
	tags_input_btn.addEventListener('click', add_tag);
	
	let submit_btn = document.getElementById("edit_submit");
	submit_btn.classList.remove("add_edit_button_disabled");
	submit_btn.classList.add("add_edit_button");
	submit_btn.addEventListener('click', editHgame);
	
	document.getElementById("remove_checkbox").checked = false;
}

function disableEditForm()
{
	document.getElementById("edit_name").disabled = true;
	document.getElementById("edit_jp_name").disabled = true;
	document.getElementById("edit_exe").disabled = true;
	
	let exe_btn = document.getElementById("edit_exe_btn");
	exe_btn.classList.remove("add_edit_input_btn_plus");
	exe_btn.classList.add("add_edit_input_btn_plus_disabled")
	exe_btn.removeEventListener('click', file_dialog);
	
	let icon_btn = document.getElementById("edit_icon_btn");
	icon_btn.classList.remove("add_edit_input_btn_plus");
	icon_btn.classList.add("add_edit_input_btn_plus_disabled");
	icon_btn.removeEventListener('click', file_dialog);
	
	document.getElementById("edit_icon").disabled = true;
	document.getElementById("edit_circle").disabled = true;
	document.getElementById("edit_tags_input").disabled = true;
	
	let tags_input_btn = document.getElementById("edit_tags_input_btn");
	tags_input_btn.classList.remove("add_edit_input_btn");
	tags_input_btn.classList.add("add_edit_input_btn_disabled");
	tags_input_btn.removeEventListener('click', add_tag);
	
	let submit_btn = document.getElementById("edit_submit");
	submit_btn.classList.remove("add_edit_button");
	submit_btn.classList.add("add_edit_button_disabled")
	submit_btn.removeEventListener('click', editHgame);
	
	submit_btn.removeAttribute('circle_index');
	submit_btn.removeAttribute('hgame_index');
	
	document.getElementById("remove_checkbox").checked = false;
	
	let remove_submit = document.getElementById("remove_submit");
	remove_submit.classList.remove("add_edit_button");
	remove_submit.classList.add("add_edit_button_disabled")
	remove_submit.removeEventListener('click', removeHgame);
	
	remove_submit.removeAttribute('circle_index');
	remove_submit.removeAttribute('hgame_index');
}

function init_edit_Page()
{
	let tab = document.getElementById("edit_tab");
	
	tab.addEventListener('click', function(event){
		
		console.log(tab.ariaSelected);
		
		if(tab.ariaSelected === 'true')
		{
			
		}
		else
		{
			clearEditForm();
		}
	});
	
	document.getElementById("edit_exe_file").addEventListener("change", function()
	{
		document.getElementById("edit_exe").value = this.files[0].path;
		this.value = "";
	});
	
	document.getElementById("edit_icon_file").addEventListener("change", function()
	{
		document.getElementById("edit_icon").value = this.files[0].path;
		this.value = "";
	});
	
	document.getElementById("edit_tags_input_btn").addEventListener('click', function(event){
		add_tag("edit_tags_input", "edit_tags_box");
	});
	
	document.getElementById("edit_tags_input").addEventListener('keypress', function(event){
		if(event.key === 'Enter')
		{
			add_tag("edit_tags_input", "edit_tags_box");
		}
	});
	
	document.getElementById("remove_checkbox").addEventListener('change', function(){
		let remove_submit = document.getElementById("remove_submit");
		
		if(this.checked)
		{
			remove_submit.classList.remove("add_edit_button_disabled");
			remove_submit.classList.add("add_edit_button")
			remove_submit.addEventListener('click', removeHgame);
		}
		else
		{
			remove_submit.classList.remove("add_edit_button");
			remove_submit.classList.add("add_edit_button_disabled")
			remove_submit.removeEventListener('click', removeHgame);
		}
	});
}