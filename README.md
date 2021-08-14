# Hgame selector
A desktop application for visualising and navigating your hgame collection.

## Notable features:

- Navigate your hgame collection via large icons representing circles and hgames utilising their cover art.
- Import metadata from DLsite so all you need to do is supply the game's executable.
- Directory scanner + auto importer/scraper , Add your entire directory and if the hgame's have a dlsite code in their path, they'll be picked up and metadata aquired.
- Mega.nz and IPFS directory scanner/downloader for browsing community hgame archives. (IPFS scan requires your daemon running)

## FAQ:

- How do I transfer my collection data between versions?
	
	Copy the "userdata" folder to the same location on the new build, found at: "[APP DIRECTORY]/resources/app/userdata/"
	
- How do I edit a hgame?
	
	Find the hgame in your collection and right click it.
	
- Does the IPFS download automatically seed/pin the file
	
	It doesn't, if/when such a feature is added it'll be entirely seperate.
	
- Does a batch add submission fail if it contains a game I've already added?

	It doesnt fail, if a hgame has already been registered it's simply ignored/skipped by the batch function. 
	
	There's no need to remove all the results from a scan with which you've already added.
	
	(Though I would advise having some kind of circle specific folder structure unless you want to scroll for ages through the results trying to find that one game you added 	  to a massive folder, or just scan the folder that the specific hgame resides in, whichever.)
