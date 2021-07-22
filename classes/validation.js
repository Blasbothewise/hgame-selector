module.exports.check_undefined = function(var_array)
{	
	for(let i = 0; i < var_array.length; i++)
	{
		if(var_array[i] === null || var_array[i] === undefined || var_array[i] === "")
		{
			throw "Missing input data";
		}
	}
}

module.exports.validatePassword = function(value, opt) //returns a boolean or an integer dependant on options
{	
	let options = { 
		minLength: 8, 
		minLowercase: 1, 
		minUppercase: 1, 
		minNumbers: 1, 
		minSymbols: 1, 
		returnScore: false, 
		pointsPerUnique: 1, 
		pointsPerRepeat: 0.5, 
		pointsForContainingLower: 10, 
		pointsForContainingUpper: 10, 
		pointsForContainingNumber: 10, 
		pointsForContainingSymbol: 10 
	};

	if(opt === true)
	{
		return validator.isStrongPassword(value, options)
	}
	else
	{
		return validator.isStrongPassword(value);
	}
}

module.exports.isOneOf = function isOneOf(val, valid_vals, varName)
{
	let match = false;
	
	for(let i = 0; i < valid_vals.length; i++)
	{
		if(val === valid_vals[i])
		{
			match = true;
		}
	}
	
	if(match === true)
	{
		
	}
	else
	{
		throw varName + "is incorrect format/does not match accepted value.";
	}
}

module.exports.is_definedString = function(input)
{	
	if(input === null || input === undefined || input.trim() === "")
	{
		return false;
	}
	else
	{
		return true;
	}
}

module.exports.is_defined = function(input)
{	
	if(input === null || input === undefined)
	{
		return false;
	}
	else
	{
		return true;
	}
}

module.exports.is_dlsite_prod_url = function(url)
{
	let val_cols = [
		"www.dlsite.com/maniax/work/=/product_id/",
		"www.dlsite.com/pro/work/=/product_id/",
		"www.dlsite.com/books/work/=/product_id/",
		"www.dlsite.com/maniax/announce/=/product_id/"
		"www.dlsite.com/pro/announce/=/product_id/"
		"www.dlsite.com/books/announce/=/product_id/"
	];
	
	for(let i = 0; i < val_cols.length; i++)
	{
		if(url.includes(val_cols[i]))
		{
			return;
		}
	}
	
	throw "URL not a dlsite url";
}

const validator = require("validator");

module.exports.validate = function(var_colls)
{
	
	for(let i = 0; i < var_colls.length; i++)
	{
		if(var_colls[i][1] === "integer")
		{
			if(validator.isInt(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "number")
		{
			if(validator.isNumeric(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "latlon")
		{
			if(validator.isLatLong(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "boolean")
		{
			if(validator.isBoolean(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "email")
		{
			if(validator.isEmail(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "not_email")
		{
			if(validator.isEmail(var_colls[i][0]) === true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "url")
		{
			if(validator.isURL(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else if(var_colls[i][1] === "postcode")
		{
			if(validator.isPostalCode(var_colls[i][0]) !== true)
			{
				throw var_colls[i][2];
			}
		}
		else
		{
			
		}
	}
}