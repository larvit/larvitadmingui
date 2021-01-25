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

	if (that.options.menuStructure) {
		that.menuStructure = that.options.menuStructure;
	} else {
		// Include menu structure config
		// Do it through stringify/parse to not screw up the original structure
		that.menuStructure = JSON.parse(JSON.stringify(require(lfs.getPathSync('config/menuStructure.json'))));
	}

	if (that.options.routerOptions.routes === undefined) { that.options.routerOptions.routes = []; }

	that.options.routerOptions.routes.push({
		regex: '^/default$',
		controllerPath: 'login.js',
		templatePath: 'login.tmpl'
	});

	that.options.routerOptions.routes.push({
		regex: '\\.css$',
		controllerPath: 'css.js'
	});

	that.acl = new Acl(that.options);
	that.basewww = new Lbwww(that.options);
	that.basewww.options.baseOptions.middleware = [
		require('cookies').express(),
		function mwParseUrl(req, res, cb) { that.basewww.mwParseUrl(req, res, cb); },
		function mwValidateRoute(req, res, cb) { that.basewww.mwValidateRoute(req, res, cb); },
		function mwRoute(req, res, cb) { that.basewww.mwRoute(req, res, cb); },
		function mwParse(req, res, cb) { that.basewww.mwParse(req, res, cb); },
		function mwSendStatic(req, res, cb) { that.basewww.mwSendStatic(req, res, cb); },
		function setPropertiesOnRequest(req, res, cb) { that.setPropertiesOnRequest(req, res, cb); },
		function (req, res, cb) {
			if (req.finished || (req.routed && req.routed.controllerPath && req.routed.controllerPath === 'css.js')) return cb();
			that.session.start(req, res, cb);
		},
		function mwSetNextCallData(req, res, cb) { that.mwSetNextCallData(req, res, cb); },
		require(lfs.getPathSync('models/controllerGlobal.js')),
		function checkAndRedirect(req, res, cb) { that.checkAndRedirect(req, res, cb); },
		function mwRunController(req, res, cb) { that.basewww.mwRunController(req, res, cb); },
		function writeSessionToDb(req, res, cb) {
			if (req.finished) return cb();
			that.session.writeToDb(req, res, cb);
		},
		function mwRender(req, res, cb) { that.basewww.mwRender(req, res, cb); },
		function mwSendToClient(req, res, cb) { that.basewww.mwSendToClient(req, res, cb); },
		function mwCleanup(req, res, cb) { that.basewww.mwCleanup(req, res, cb); }
	];

	if (that.options.middleware) {
		that.basewww.options.baseOptions.middleware.splice(9, 0, ...that.options.middleware);
	}

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

App.prototype.mwSetNextCallData = function mwSetNextCallData(req, res, cb) {
	if (req.finished) return cb();

	if (req.session && req.session.data && req.session.data.nextCallData) {
		// TODO(vktr): Probably should do this recursive instead
		for (const key of Object.keys(req.session.data.nextCallData)) {
			for (const subKey of Object.keys(req.session.data.nextCallData[key])) {
				if (!res[key]) {
					res[key] = {};
				}

				res[key][subKey] = req.session.data.nextCallData[key][subKey];
			}
		}

		delete req.session.data.nextCallData;
	}

	cb();
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

	// TODO: Figure out a better way to reset the menu structure between requests.
	// Some controllers modify the menuStructure which is why we need to reset it.
	// Object.assign does not do a deep copy, so we use JSON parse/stringify to
	// create a deep copy.
	req.menuStructure = JSON.parse(JSON.stringify(that.menuStructure));

	return cb();
};

App.prototype.checkAndRedirect = function checkAndRedirect(req, res, cb) {
	const that = this;

	if (req.finished || (req.routed && req.routed.controllerPath && req.routed.controllerPath === 'css.js')) return cb();

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
			// Instead just run sendToClient directly, circumventing the afterware as well.
			res.end('Access denied');
			req.finished = true;
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
	this.ready(() => {
		this.basewww.start(cb);
	});
};

App.prototype.stop = function stop(cb) {
	this.basewww.stop(cb);
};

exports = module.exports = App;
