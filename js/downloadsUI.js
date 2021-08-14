var downloads_count = 0;
var downloads = {};

function addDownload(download)
{
	let download_elem = document.createElement("div");
	download_elem.classList.add("download");
	download_elem.id = download.url;
		
		let download_icon = document.createElement("div");
		download_icon.classList.add("download_icon");
		download_icon.style.backgroundImage = 'url("' + download.image + '")';
		
		let download_col_1 = document.createElement("div");
		download_col_1.classList.add("download_col_1");
		download_col_1.innerHTML = download.filename;
		
		let download_col_2 = document.createElement("div");
		download_col_2.classList.add("download_col_2");
		download_col_2.innerHTML = "0/" +  download.size;
		
		let download_col_3 = document.createElement("div");
		download_col_3.classList.add("download_col_3");
		download_col_3.innerHTML = download.type
		
		let download_btn_cancel = document.createElement("div");
		download_btn_cancel.classList.add("download_btn");
		download_btn_cancel.classList.add("cancel");
		download_btn_cancel.innerHTML = "cancel";
		
		download_btn_cancel.addEventListener('click', cancelDownload);
		
		let download_btn_install = document.createElement("div");
		download_btn_install.classList.add("download_btn");
		download_btn_install.classList.add("hidden");
		download_btn_install.innerHTML = "install";
		
		let download_success = document.createElement("div");
		download_success.classList.add("download_success");
		download_success.classList.add("hidden");
		download_success.innerHTML = "Complete";
		
		let download_btn_open = document.createElement("div");
		download_btn_open.classList.add("download_btn");
		download_btn_open.classList.add("hidden");
		download_btn_open.innerHTML = "open";
		
		console.log(config.downloads_path + "\\" + download.filename);
		download_btn_open.addEventListener('click', function(){
			ipcRenderer.send('openPath', {path: config.downloads_path + "\\" + download.filename, relative: false, file: true});
		});
		
		let download_btn_close = document.createElement("div");
		download_btn_close.classList.add("download_btn");
		download_btn_close.classList.add("hidden");
		download_btn_close.innerHTML = "close";
		download_btn_close.addEventListener('click', removeDownload_viabtn);
		
		let download_failed = document.createElement("div");
		download_failed.classList.add("download_failed");
		download_failed.classList.add("hidden");
		download_failed.innerHTML = "Failed";
		
		let download_btn_retry = document.createElement("div");
		download_btn_retry.classList.add("download_btn");
		download_btn_retry.classList.add("hidden");
		download_btn_retry.innerHTML = "retry";
		download_btn_retry.addEventListener('click', retry_download_mega);
		
		let download_btn_close_2 = document.createElement("div");
		download_btn_close_2.classList.add("download_btn");
		download_btn_close_2.classList.add("hidden");
		download_btn_close_2.innerHTML = "close";
		download_btn_close_2.addEventListener('click', removeDownload_viabtn);
		
	download_elem.appendChild(download_icon);
	download_elem.appendChild(download_col_1);
	download_elem.appendChild(download_col_2);
	download_elem.appendChild(download_col_3);
	download_elem.appendChild(download_btn_cancel);
	download_elem.appendChild(download_success);
	download_elem.appendChild(download_btn_open);
	download_elem.appendChild(download_btn_close);
	download_elem.appendChild(download_failed);
	download_elem.appendChild(download_btn_retry);
	download_elem.appendChild(download_btn_close_2);
	
	document.getElementById("downloads_cntr").appendChild(download_elem);
}

function cancelDownload()
{
	this.classList.add("disabled");
	this.removeEventListener('click', cancelDownload);
	ipcRenderer.send('cancelDownload', this.parentNode.id);
}

function enable_download_cancel(url)
{
	let cancel = document.getElementById(url).elem.children[4];
	
	cancel.classList.remove("disabled");
	cancel.addEventListener('click', cancelDownload);
}

function removeDownload(url)
{
	delete downloads[url];
	let elem = document.getElementById(url);
	elem.parentNode.removeChild(elem)
}

function removeDownload_viabtn()
{
	delete downloads[this.parentNode.id];
	ipcRenderer.send('clearDownload', this.parentNode.id);
	
	this.parentNode.parentNode.removeChild(this.parentNode);
}

function updateDownload(data, url)
{
	let download = downloads[url];

	console.log("Download completion: " + bytes_to_readable(data.retrieved_bytes, true) + "/" + download.size)

	let elem = document.getElementById(url);

	console.log("status:" + data.status);

	switch(data.status)
	{
		case "complete":
			
			clearInterval(download.interval);
			downloads_count--;
			
			elem.children[2].innerHTML = bytes_to_readable(data.retrieved_bytes, false) + "/" + download.size;
			elem.children[4].style.display = "none"; //Hide cancel button
			elem.children[5].classList.remove("hidden"); //Show install button
			elem.children[6].classList.remove("hidden"); //Show open button
			elem.children[7].classList.remove("hidden"); //Show close button
			
		break;
		
		case "in progress":
			elem.children[2].innerHTML = bytes_to_readable(data.retrieved_bytes, true) + "/" + download.size;
		break;
		
		case "failed":
		
			clearInterval(download.interval);
			downloads_count--;
		
			elem.children[4].style.display = "none"; //Hide cancel button
			elem.children[8].classList.remove("hidden"); //Show failed label
			elem.children[9].classList.remove("hidden"); //Show retry button
			elem.children[10].classList.remove("hidden"); //Show second close button
		
		break;
		
		case "cancelled":
		
			clearInterval(download.interval);
			downloads_count--;
			
			removeDownload(url);
		break;
	}
}

function retry_download_mega()
{
	elem = this.parentNode;
	
	downloads[elem.id].interval = setInterval(function(){
		ipcRenderer.send('get_download_progress_mega', elem.id);
	}, 1000);
	
	elem.children[4].style.display = "flex"; //Show cancel button
	elem.children[8].classList.add("hidden"); //Hide failed label
	elem.children[9].classList.add("hidden"); //Hide retry button
	elem.children[10].classList.add("hidden"); //Hide second close button
	
	ipcRenderer.send('downloadHgame_mega', {url: elem.id, filename: downloads[elem.id].filename, type: "mega", retry: true});
}