'use strict';

const	topLogPrefix	= 'larvitadmingui: index.js: ',
	DbMigration	= require('larvitdbmigration'),
	Session	= require('larvitsession'),
	LUtils	= require('larvitutils'),
	Events	= require('events'),
	emitter	= new Events(),
	Acl	= require(__dirname + '/models/acl.js'),
	Lfs	= require('larvitfs'),
	lfs	= new Lfs(),
	_	= require('lodash');

let	dbReady	= false,
	session;

// Extend lodash
_.defaultsDeep	= require('lodash.defaultsdeep');
_.urlUtil	= require(__dirname + '/models/utils.js').urlUtil;
_.trim	= require('lodash.trim');

function App(options) {
	const	logPrefix	= topLogPrefix + 'App() - ',
		that	= this;

	that.options	= options || {};
	that.emitter	= new Events();
	that.dbReady	= false;

	if ( ! that.options.log) {
		const	lUtils	= new LUtils();

		that.options.log	= new lUtils.Log();
	}
	that.log	= that.options.log;

	if ( ! that.options.db) {
		const	err	= new Error('Required option "db" is missing');
		that.log.error(logPrefix + err.message);
		throw err;
	}
	that.db	= that.options.db;

	if ( ! that.options.userLib) {
		const	err	= new Error('Required option "userLib" is missing');
		that.log.error(logPrefix + err.message);
		throw err;
	}
	that.userLib	= that.options.userLib;

	that.runDbMigrations();
}

App.prototype.runDbMigrations = function runDbMigrations() {
	const	logPrefix	= topLogPrefix + 'App.runDbMigrations() - ',
		options	= {},
		that	= this;

	let	dbMigration;

	options.dbType	= 'mariadb';
	options.dbDriver	= that.db;
	options.tableName	= 'admingui_db_version';
	options.migrationScriptsPath	= __dirname + '/dbmigration';
	options.log	= that.log;

	dbMigration	= new DbMigration(options);
	that.userLib.dataWriter.ready(function (err) {
		if (err) {
			that.log.error(logPrefix + err.message);
			throw err;
		}

		dbMigration.run(function (err) {
			if (err) {
				that.log.error(logPrefix + err.message);
				throw err;
			}

			that.emitter.emit('dbReady');
			that.dbReady	= true;
		});
	});
};

App.prototype.ready = function ready(cb) {
	const	that	= this;

	if (that.dbReady) return cb();
	that.emitter.on('dbReady', cb);
};

App.prototype.start = function start(cb) {
	const	logPrefix	= topLogPrefix + 'App.start() - ',
		that	= this;

};

exports = module.exports = function runServer(customOptions) {
	const	logPrefix	= topLogPrefix + 'runServer() - ';

	let	returnObj,
		acl;

	if (customOptions === undefined) {
		customOptions	= {};
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
	customOptions.middleware.push(function (req, res, cb) { session.start(req, res, cb); }); // Important that this is ran after the cookie middleware
	customOptions.middleware.push(require(lfs.getPathSync('models/controllerGlobal.js')).middleware());

	customOptions.afterware.push(function (req, res, data, cb) { session.writeToDb(req, res, cb);});

	returnObj	= require('larvitbase')(customOptions);

	returnObj.on('httpSession', function (req, res) {
		const	originalRunController	= res.runController;

		if (customOptions.langs) {
			res.langs	= customOptions.langs;
		}

		// Default admin rights to be false
		// In the bottom this gets set to true if a correct user is logged in
		res.adminRights	= false;

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

			res.next();
		});
	});

	return returnObj;
};
