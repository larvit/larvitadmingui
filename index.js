'use strict';

const topLogPrefix = 'larvitadmingui: index.js: ';
const DbMigration = require('larvitdbmigration');
const Session = require('larvitsession');
const LUtils = require('larvitutils');
const Lbwww = require('larvitbase-www');
const Events = require('events');
const Acl = require(__dirname + '/models/acl.js');
const Lfs = require('larvitfs');
const lfs = new Lfs();
const _ = require('lodash');

// Extend lodash
_.defaultsDeep = require('lodash.defaultsdeep');
_.urlUtil = require(__dirname + '/models/utils.js').urlUtil;
_.trim = require('lodash.trim');

function App(options) {
	const logPrefix = topLogPrefix + 'App() - ';
	const that = this;

	that.options = options || {};
	that.options.baseOptions = that.options.baseOptions || {};
	that.options.routerOptions = that.options.routerOptions || {};
	that.options.baseOptions.httpOptions = that.options.baseOptions.httpOptions || {};
	that.emitter = new Events();
	that.dbReady = false;

	if (!that.options.log) {
		const lUtils = new LUtils();

		that.options.log = new lUtils.Log();
	}
	that.log = that.options.log;

	if (!that.options.db) {
		const err = new Error('Required option "db" is missing');
		that.log.error(logPrefix + err.message);
		throw err;
	}
	that.db = that.options.db;

	if (!that.options.userLib) {
		const err = new Error('Required option "userLib" is missing');
		that.log.error(logPrefix + err.message);
		throw err;
	}
	that.userLib = that.options.userLib;

	if (!that.options.session) {
		that.options.session = new Session({
			db: that.db,
			log: that.log
		});
	}
	that.session = that.options.session;

	if (that.options.routerOptions.routes === undefined) { that.options.routerOptions.routes = []; }

	that.options.routerOptions.routes.push({
		regex: '^/default$',
		controllerPath: 'login.js',
		templatePath: 'login.tmpl'
	});

	that.options.routerOptions.routes.push({
		regex: '\\.css$',
		controller: 'css'
	});

	that.options.baseOptions.httpOptions.port = options.port;

	that.acl = new Acl(that.options);
	that.basewww = new Lbwww(that.options);
	that.basewww.options.baseOptions.middleware = [
		require('cookies').express(),
		function (req, res, cb) { that.session.start(req, res, cb); },
		function mwParse(req, res, cb) { that.basewww.mwParse(req, res, cb); },
		function mwRoute(req, res, cb) { that.basewww.mwRoute(req, res, cb); },
		function mwSendStatic(req, res, cb) { that.basewww.mwSendStatic(req, res, cb); },
		function setPropertiesOnRequest(req, res, cb) { that.setPropertiesOnRequest(req, res, cb); },
		require(lfs.getPathSync('models/controllerGlobal.js')).middleware(),
		function checkAndRedirect(req, res, cb) { that.checkAndRedirect(req, res, cb); },
		function mwRunController(req, res, cb) { that.basewww.mwRunController(req, res, cb); },
		function mwRender(req, res, cb) { that.basewww.mwRender(req, res, cb); },
		function mwSendToClient(req, res, cb) { that.basewww.mwSendToClient(req, res, cb); },
		function mwCleanup(req, res, cb) { that.basewww.mwCleanup(req, res, cb); },
		function writeSessionToDb(req, res, cb) { that.session.writeToDb(req, res, cb); }
	];

	that.runDbMigrations();
}

App.prototype.runDbMigrations = function runDbMigrations() {
	const logPrefix = topLogPrefix + 'App.runDbMigrations() - ';
	const options = {};
	const that = this;

	let dbMigration;

	options.dbType = 'mariadb';
	options.dbDriver = that.db;
	options.tableName = 'admingui_db_version';
	options.migrationScriptsPath = __dirname + '/dbmigration';
	options.log = that.log;

	dbMigration = new DbMigration(options);
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
			that.dbReady = true;
		});
	});
};

App.prototype.setPropertiesOnRequest = function setPropertiesOnRequest(req, res, cb) {
	const that = this;

	// Default admin rights to be false
	// In the bottom this gets set to true if a correct user is logged in
	res.adminRights = false;

	// Make ACL object available for other parts of the system
	req.acl = that.acl;

	req.db = that.db;
	req.userLib = that.userLib;
	req.log = that.log;

	return cb();
};

App.prototype.checkAndRedirect = function checkAndRedirect(req, res, cb) {
	const that = this;

	that.acl.checkAndRedirect(req, res, function (err, userGotAccess) {
		if (err) {
			that.log.error(logPrefix + err.message);

			return cb(err);
		}

		// User got access, proceed with executing the controller
		if (userGotAccess) {
			res.adminRights = true;
		} else {
			// If userGotAccess is false, we should not execute the controller.
			// Instead just run sendToClient directly
			res.end('Access denied');
		}

		cb();
	});
};

App.prototype.ready = function ready(cb) {
	const that = this;

	if (that.dbReady) return cb();
	that.emitter.on('dbReady', cb);
};

App.prototype.start = function start(cb) {
	this.basewww.start(cb);
};

App.prototype.stop = function stop(cb) {
	this.basewww.stop(cb);
};

exports = module.exports = App;
