console.log("created scraper object");
const validator = require("./validation.js");

const makerUrls = [
	"https://www.dlsite.com/maniax/circle/profile/=/maker_id/",
	"https://www.dlsite.com/pro/circle/profile/=/maker_id/",
	"https://www.dlsite.com/books/circle/profile/=/maker_id/"
];

const productUrls = [
	"https://www.dlsite.com/maniax/work/=/product_id/",
	"https://www.dlsite.com/pro/work/=/product_id/",
	"https://www.dlsite.com/books/work/=/product_id/"
];

const cheerio = require('cheerio');
const axios = require('axios');

async function fetchHTML(url) {
  const { data } = await axios.get(url)
  return cheerio.load(data)
}

function getDLCode(url, matchSet)
{
	url = url.replace(".html", "");
	
	for(let i = 0; i < matchSet.length; i++)
	{
		if(url.includes(matchSet[i]))
		{
			url = url.replace(matchSet[i], "");
			break;
		}
	}
	
	url = url.replace("/", "");
	
	return url;
}

function getProductThumb(suffix, code)
{
	let rounded_code = (Math.ceil(parseFloat(code.substring(2,code.length)) / 1000) * 1000).toString();
	
	while(rounded_code.length < 6)
	{
		rounded_code += '0';
	}
	
	let suffixCode = code.substring(0,2) + rounded_code;
}

module.exports.scrapeDLsite = function(url)
{	
	return new Promise((resolve,reject) => {
		let input_data = [
			url
		];
	
		validator.check_undefined(input_data);
		
		validator.validate([[url,"url","Url is not correct format."]]);
		
		validator.is_dlsite_prod_url(url);
		
		if(url.includes("?locale="))
		{
			url = url.substring(0, url.length - 5) + "en_US";
		}
		else if(url.substring(url.length -1) === '/')
		{
			url += "?locale=en_US";
		}
		else
		{
			url += "/?locale=en_US";
		}
		
		let product;
		
		fetchHTML(url)
		.then(function(result){
			
			let meta_html = result('#work_outline > tbody > tr');
			let metaSets = [];
			
			let prod_name = result("#work_name").find("a");
			let maker = result("#work_maker").find(".maker_name > a");
			
			let icon = result('meta[name="twitter:image:src"]').attr('content');
			
			product = {
				"name": {
					name: prod_name.text(),
					code: getDLCode(prod_name.attr("href"), productUrls)
				},
				"icon": icon,
				"brand": {
					name: maker.text(),
					code: getDLCode(maker.attr("href"), makerUrls)
				}
			}
			
			let product_metadata = {};
			
			for(let i = 1; i < result('#work_outline > tbody > tr').toArray().length + 1; i++)
			{					
				let metaSet = result('#work_outline > tbody > tr:nth-child(' + i + ')');
				
				let header = metaSet.find("th").text().trim().replace(' ', '_');
				
				let val;
				let valType;
				
				let checks = ['a', '.work_genre', '.main_genre'];
				
				for(let i = 0; i < checks.length; i++)
				{
					val = metaSet.find("td > " + checks[i]);
					
					if(val.length === 1)
					{
						valType = checks[i];
						break;
					}
					else if(checks[i] === 'a' && val.length > 1)
					{
						valType = "aMult";
						break;
					}
				}
				
				let data = {};
				
				let foundNothing = false;
				
				switch(valType)
				{
					case "a":
						//data.url = val.href();
						
						data.text = val.text();
					break;
					
					case "aMult":
					case ".work_genre":						
					case ".main_genre":
						
						data.items = [];
						
						let arr;
						
						switch(valType)
						{
							case "aMult":
								arr = val.toArray();
							break;
							
							case ".work_genre":
								arr = val.find('span').toArray();
							break;
							
							case ".main_genre":
								arr = val.find('a').toArray();
								
								if(arr.length === 0)
								{
									arr = val.text().trim().split("\n");
								}
								
							break;
						}
						
						if(typeof arr[0] === 'string')
						{
							data.items.push(val.text().trim());
						}
						else
						{
							for(let i = 0; i < arr.length; i++)
							{
								data.items.push(arr[i].children[0].data);
							}
						}
					break;
					
					default:
						foundNothing = true;
				}
				
				if(foundNothing === false)
				{
					product_metadata[header] = data;
				}
			}
			
			product.product_metadata = product_metadata;
			
			url = url.substring(0, url.length - 5) + "ja_JP";
			
			return fetchHTML(url);
		})
		.then(function(result){
			let prod_jp_name = result("#work_name").find("a");
			
			product.jp_name = prod_jp_name.text();
			
			resolve(product);
		})
		.catch(function(error){
			reject(error);
		});
	});
}

module.exports.importVNDB = function(url, creds)
{
	
}