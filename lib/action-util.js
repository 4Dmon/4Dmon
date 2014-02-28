// ---------------------------------------------
// A library of 'action' functions that help
// in performing tasks such as starting and
// stopping server and client.
// ---------------------------------------------

var cp = require( "child_process" )
	, valise = require( "valise" )
	, nconf = valise( "lib:config-util" ).nconf
	, path = require( "path" )
	, join = path.join
	, os = require( "os" )
	, fs = require( "fs" )
	, wrench = require( "wrench" )
	, stageOrProd
	, machinesConf = nconf.get('machines')
	, backupConf = nconf.get('backup')
	, getFolderName
	, syncFileCopy
	, getFormattedDate
	;

// ---------------------------------------------
// Is this a stage machine or a prod machine?
// Assume stage if there is no designation.
// ---------------------------------------------
stageOrProd = function() {

	if (machinesConf.prod.indexOf(os.hostname()) !== -1) {
		return "prod";
	}
	else {
		return "stage";
	}
};

// ---------------------------------------------
// Get the folder name from the end of a path
// ---------------------------------------------
getFolderName = function(folder) {
	var i = folder.lastIndexOf('\\');
	return folder.substring(i + 1);
};

// ---------------------------------------------
// Synchronous file copy
// ---------------------------------------------
syncFileCopy = function(src, dest) {
	var newFile = fs.createWriteStream(dest)
		, oldFile = fs.createReadStream(src)
		;

	oldFile.pipe(newFile);
};

// ---------------------------------------------
// Return the current date as a formatted string
// ---------------------------------------------
getFormattedDate = function() {
	var today = new Date()
		, monthNum = today.getMonth() + 1
		, month = monthNum < 10 ? "0" + monthNum : "" + monthNum
		, dateNum = today.getDate()
		, date = dateNum < 10 ? "0" + dateNum : "" + dateNum
		;

	return today.getFullYear() + "-" + month + "-" + date;
};


// ---------------------------------------------
// Execute a script that performs an action
// ---------------------------------------------
module.exports.executeScript = function( clientServer, action, cb ) {

	var conf = nconf.get("4d" + clientServer)
		, cmd
		, output = ""
		, errors = ""
		, stageProd = stageOrProd()
		// For the start action, we need to specify either stage or prod as an option
		, cmdOptions = action === "start" ? " " + stageProd : ""
		;

	// ---------------------------------------------
	// Execute the command
	// ---------------------------------------------
	cmd = cp.exec(join( conf["scriptsPath"], clientServer + "_" + action + ".bat" + cmdOptions));

	cmd.stdout.on("data", function(data) {
		output += data;
	});

	cmd.stderr.on("data", function(data) {
		errors += data;
	});

	cmd.on("exit", function() {
		if(errors) {
			cb(new Error(errors));
		}
		else {
			cb(null, output, errors);
		}
	});

};

// ---------------------------------------------
// Creates a backup folder according to configuration
// file backup.json
// ---------------------------------------------
module.exports.backup = function( folderName ) {

	var backupItems = backupConf["backup_items"]
		, i
		, stat
		, path
		, output = ""
		, backupFolder
		;

	// Set the root backup folder from configuration
	backupFolder = backupConf["backup_dir"];

	// Set the backup folder name in the default manner if undefined
	if(!folderName) {
		backupFolder = join(backupFolder, getFormattedDate());
	}
	else {
		backupFolder = join(backupFolder, folderName);
	}

	// Make the backup folder if it doesn't already exist
	output += "Creating backup folder at: " + backupFolder + "\n";
	if(!fs.existsSync(backupFolder)) {
		fs.mkdirSync(backupFolder);
	}
	
	for (i = backupItems.length - 1; i >= 0; i--) {
		path = backupItems[i];
		
		if(fs.existsSync(path)) {
			// ---------------------------------------------
			// Check if this is a file or folder.
			//  file -- Synchronous file copy with fs streams
			//  folder -- Recursive folder copy with wrench
			// ---------------------------------------------
			stat = fs.lstatSync(path);

			if(stat.isFile()) {
				output += "Copying file: " + path + "\n";
				syncFileCopy(path, join(backupFolder, getFolderName(path)));
			}
			else {
				output += "Recursively copying folder: " + path + "\n";
				// Careful! This copy deletes any existing stuff that it writes to!
				wrench.copyDirSyncRecursive(path, join(backupFolder, getFolderName(path)));
			}
		}
		else {
			output += "Could not find file or folder: " + path + "\n";
		}
	}

	output += "Done!!";
	return output;
};
