'use strict';

const	topLogPrefix	= 'larvitadmingui: index.js: ',
	DbMigration	= require('larvitdbmigration'),
	Session	= require('larvitsession'),
	LUtils	= require('larvitutils'),
	Events	= require('events'),
	Acl	= require(__dirname + '/models/acl.js'),
	Lfs	= require('larvitfs'),
	lfs	= new Lfs(),
	_	= require('lodash');

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

	if ( ! that.options.session) {
		that.options.session = new Session({
			'db':	that.db,
			'log':	that.log
		});
	}
	that.session	= that.options.session;

	if (that.options.customRoutes	=== undefined) { that.options.customRoutes	= []; }
	if (that.options.middleware	=== undefined) { that.options.middleware	= []; }
	if (that.options.afterware	=== undefined) { that.options.afterware	= []; }

	that.options.customRoutes.push({
		'regex':	'^/$',
		'controllerName':	'login'
	});

	that.options.customRoutes.push({
		'regex':	'\\.css$',
		'controllerName':	'css'
	});

	that.acl	= new Acl(that.options);

	that.options.middleware.push(require('cookies').express());
	that.options.middleware.push(function (req, res, cb) { that.session.start(req, res, cb); }); // Important that this is ran after the cookie middleware
	that.options.middleware.push(require(lfs.getPathSync('models/controllerGlobal.js')).middleware());

	that.options.afterware.push(function (req, res, data, cb) { that.session.writeToDb(req, res, cb);});

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

	that.lBase	= require('larvitbase')(that.options);
	cb();

	that.lBase.on('httpSession', function (req, res) {
		const	originalRunController	= res.runController;

		if (that.options.langs) {
			res.langs	= that.options.langs;
		}

		// Default admin rights to be false
		// In the bottom this gets set to true if a correct user is logged in
		res.adminRights	= false;

		// Make ACL object available for other parts of the system
		req.acl	= that.acl;

		req.db	= that.db;
		req.userLib	= that.userLib;
		req.log	= that.log;

		that.ready(function (err) {
			if (err) {
				that.log.error(logPrefix + err.message);
				return;
			}

			res.runController = function () {
				that.acl.checkAndRedirect(req, res, function (err, userGotAccess) {
					if (err) {
						that.log.error(logPrefix + err.message);
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
};

exports = module.exports = App;