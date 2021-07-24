

function directory_dialog_config()
{
	let elem = this;
	
	function directory_dialog_res(event, args)
	{
		if(args.status === "success")
		{
			console.log(args);
			if(args.data !== undefined)
			{				
				document.getElementById(args.tbx).value = args.data;
			}
		}
		else
		{
			console.log(args.message);
			printError(args.message);
		}
		
		elem.classList.remove("config_btn_disabled");
		elem.addEventListener('click', directory_dialog_config);
		
		ipcRenderer.removeListener('getFilePath_res', directory_dialog_res);
	}
	
	ipcRenderer.on('getFolderPath_res', directory_dialog_res);
	
	ipcRenderer.send('getFolderPath', elem.getAttribute("tbx"));
	
	this.removeEventListener('click', directory_dialog_config);
	this.classList.add("config_btn_disabled");
}

function submit_config()
{	
	let elems = [
		document.getElementById("config_tbx_downloads"),
		//document.getElementById("config_tbx_install"),
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
			elems[i].style.borderColor = "white";
		}
	}
	
	if(valError === false)
	{
		let config = {
			downloads_path: document.getElementById("config_tbx_downloads").value.trim(),
			//install_path: document.getElementById("config_tbx_install").value.trim(),
		};
		
		ipcRenderer.send('setConfig', config);
		disableConfigForm();
	}
}

function disableConfigForm()
{
	let download = document.getElementById("config_download_submit");
	download.classList.toggle("config_btn_disabled");
	download.removeEventListener('click', directory_dialog_config);
	//let install = document.getElementById("config_install_submit");
	//install.classList.toggle("config_btn_disabled");
	//install.removeEventListener('click', directory_dialog_config);
	let sub = document.getElementById("config_download_submit");
	sub.classList.toggle("config_btn_disabled");
	download.removeEventListener('click', submit_config);
}

function enableConfigForm()
{
	let download = document.getElementById("config_download_submit");
	download.classList.toggle("config_btn_disabled");
	download.addEventListener('click', directory_dialog_config);
	//let install = document.getElementById("config_install_submit");
	//install.classList.toggle("config_btn_disabled");
	//install.addEventListener('click', directory_dialog_config);
	let sub = document.getElementById("config_download_submit");
	sub.classList.toggle("config_btn_disabled");
	download.addEventListener('click', submit_config);
}

function populate_config(config)
{
	document.getElementById("config_tbx_downloads").value = config.downloads_path;
	//document.getElementById("config_tbx_install").value = config. install_path;
}

function init_config()
{
	document.getElementById("config_download_submit").addEventListener('click', directory_dialog_config);
	//document.getElementById("config_install_submit").addEventListener('click', directory_dialog_config);
	document.getElementById("config_submit").addEventListener('click', submit_config);
}