'use strict';

const	topLogPrefix	= 'larvitadmingui: server.js: ',
	DbMigration	= require('larvitdbmigration'),
	options	= {},
	Events	= require('events'),
	emitter	= new Events(),
	Acl	= require(__dirname + '/models/acl.js'),
	lfs	= require('larvitfs'),
	log	= require('winston'),
	_	= require('lodash');

let	dbMigration,
	dbReady	= false;

// Extend lodash
_.defaultsDeep	= require('lodash.defaultsdeep');
_.urlUtil	= require(__dirname + '/models/utils.js').urlUtil;
_.trim	= require('lodash.trim');

options.dbType	= 'larvitdb';
options.dbDriver	= require('larvitdb');
options.tableName	= 'admingui_db_version';
options.migrationScriptsPath	= __dirname + '/dbmigration';

dbMigration	= new DbMigration(options);
dbMigration.run(function (err) {
	if (err) {
		throw err; // Fatal
	}

	emitter.emit('dbReady');
	dbReady	= true;
});

function ready(cb) {
	if (dbReady) return cb();
	emitter.on('dbReady', cb);
}

exports = module.exports = function runServer(customOptions) {
	const	logPrefix	= topLogPrefix + 'runServer() - ';

	let	returnObj,
		acl;

	if (customOptions === undefined) {
		customOptions = {};
	}

	if (customOptions.customRoutes	=== undefined) { customOptions.customRoutes	= []; }
	if (customOptions.middleware	=== undefined) { customOptions.middleware	= []; }
	if (customOptions.afterware	=== undefined) { customOptions.afterware	= []; }

	customOptions.customRoutes.push({
		'regex':	'^/$',
		'controllerName':	'login'
	});

	customOptions.customRoutes.push({
		'regex':	'\\.css$',
		'controllerName':	'css'
	});

	acl	= new Acl(customOptions);

	customOptions.middleware.push(require('cookies').express());
	customOptions.middleware.push(require('larvitsession').middleware()); // Important that this is ran after the cookie middleware
	customOptions.middleware.push(require(lfs.getPathSync('models/controllerGlobal.js')).middleware());

	customOptions.afterware.push(require('larvitsession').afterware());

	returnObj = require('larvitbase')(customOptions);

	returnObj.on('httpSession', function (req, res) {
		const originalRunController = res.runController;

		if (customOptions.langs) {
			res.langs = customOptions.langs;
		}

		// Default admin rights to be false
		// In the bottom this gets set to true if a correct user is logged in
		res.adminRights = false;

		// Make ACL object available for other parts of the system
		req.acl	= acl;

		ready(function (err) {
			if (err) throw err;

			res.runController = function () {
				acl.checkAndRedirect(req, res, function (err, userGotAccess) {
					if (err) {
						log.error(logPrefix + err.message);
						res.end('Server error');
						return;
					}

					// User got access, proceed with executing the controller
					if (userGotAccess) {
						res.adminRights	= true;

						originalRunController();
					} else {
						// If userGotAccess is false, we should not execute the controller.
						// Instead just run sendToClient directly, circumventing the afterware as well.
						res.end('Access denied');
						//res.sendToClient(null, req, res);
					}
				});
			};
		});

		res.next();
	});

	return returnObj;
};
