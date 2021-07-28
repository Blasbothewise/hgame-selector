

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
		//document.getElementById("config_tbx_daemon_hostname"),
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
			ipfs_daemon_hostname: document.getElementById("config_tbx_daemon_hostname").value.trim(),
		};
		
		ipcRenderer.send('setConfig', config);
		
		ipcRenderer.send('reconnect_ipfs', {
			hostname: config.ipfs_daemon_hostname
		});
		
		disableConfigForm();
	}
}

function disableConfigForm()
{
	let download = document.getElementById("config_download_submit");
	download.classList.toggle("config_btn_disabled");
	download.removeEventListener('click', directory_dialog_config);
	let daemon = document.getElementById("config_daemon_connect");
	daemon.classList.toggle("config_btn_disabled");
	daemon.removeEventListener('click', test_ifps_daemon_config);
	let sub = document.getElementById("config_download_submit");
	sub.classList.toggle("config_btn_disabled");
	download.removeEventListener('click', submit_config);
}

function enableConfigForm()
{
	let download = document.getElementById("config_download_submit");
	download.classList.toggle("config_btn_disabled");
	download.addEventListener('click', directory_dialog_config);
	let daemon = document.getElementById("config_daemon_connect");
	daemon.classList.toggle("config_btn_disabled");
	daemon.addEventListener('click', test_ifps_daemon_config);
	let sub = document.getElementById("config_download_submit");
	sub.classList.toggle("config_btn_disabled");
	download.addEventListener('click', submit_config);
}

function populate_config(config)
{
	document.getElementById("config_tbx_downloads").value = config.downloads_path;
	document.getElementById("config_tbx_daemon_hostname").value = config.ipfs_daemon_hostname;
}

function test_ifps_daemon_config()
{
	ipcRenderer.send('testIpfsDaemon_config', {
		hostname: document.getElementById("config_tbx_daemon_hostname").value.trim()
	});
}

function init_config()
{
	document.getElementById("config_download_submit").addEventListener('click', directory_dialog_config);
	document.getElementById("config_daemon_connect").addEventListener('click', test_ifps_daemon_config);
	document.getElementById("config_submit").addEventListener('click', submit_config);
}