'use strict';

const	topLogPrefix	= 'larvitadmingui: ' + __filename + ' - ',
	Middleware	= require(__dirname + '/models/middleware.js'),
	ReqParser	= require('larvitreqparser'),
	Router	= require('larvitrouter'),
	LBase	= require('larvitbase'),
	Acl	= require(__dirname + '/models/acl.js'),
	Lfs	= require('larvitfs'),
	log	= require('winston'),
	_	= require('lodash');

log.appLogPrefix	= 'larvituser-api: ';

// Extend lodash
_.defaultsDeep	= require('lodash.defaultsdeep');
_.urlUtil	= require(__dirname + '/models/utils.js').urlUtil;
_.trim	= require('lodash.trim');

function Server(options, cb) {
	const	logPrefix = topLogPrefix + 'Server() - ',
		that	= this;

	if (typeof options === 'function') {
		cb	= options;
		options	= {};
	}

	if ( ! options) {
		options	= {};
	}

	that.options	= options;

	if (that.options.userApiUrl === undefined) {
		const	err	= new Error('options.userApiUrl is missing');
		log.error(logPrefix + err.message);
		return cb(err);
	}

	if (that.options.routerOptions	=== undefined)	{ that.options.routerOptions	= {};	}
	if (that.options.lBaseOptions	=== undefined)	{ that.options.lBaseOptions	= {};	}
	if ( ! Array.isArray(that.options.routerOptions.routes))		{ that.options.routerOptions.routes	= [];	}
	if ( ! that.options.routerOptions.basePath)		{ that.options.routerOptions.basePath	= __dirname;	}
	if ( ! that.options.routerOptions.templatesPath)		{ that.options.routerOptions.templatesPath	= 'public/tmpl';	}

	that.options.routerOptions.routes.push({
		'regex':	'^/$',
		'controllerPath':	'login.js',
		'templatePath':	'login.tmpl'
	});

	that.options.routerOptions.routes.push({
		'regex':	'\\.css$',
		'controllerPath':	'css.js'
	});

	that.lfs	= new Lfs({'basePath': __dirname});
	that.middleware	= new Middleware();

	if ( ! Array.isArray(that.options.lBaseOptions.middleware)) {
		that.options.lBaseOptions.middleware	= [];

		that.reqParser	= new ReqParser();
		that.options.lBaseOptions.middleware.push(function (req, res, cb) {
			that.reqParser.parse(req, res, cb);
		});

		that.router	= new Router(that.options.routerOptions);
		that.options.lBaseOptions.middleware.push(function (req, res, cb) {
			that.router.resolve(req.url, function (err, result) {
				req.routed	= result;
				cb(err);
			});
		});

		that.options.lBaseOptions.middleware.push(function (req, res, cb) {
			middleware.run(req, res, cb);
		});
	}

	that.lBase	= new LBase(that.options.lBaseOptions);
}

exports = module.exports = Server;


function runServer(customOptions) {
	acl	= new Acl(customOptions);

	customOptions.middleware.push(require('cookies').express());
	customOptions.middleware.push(require('larvitsession').middleware()); // Important that this is ran after the cookie middleware
	customOptions.middleware.push(require(lfs.getPathSync('models/controllerGlobal.js')).middleware());

	customOptions.afterware.push(require('larvitsession').afterware());

	returnObj	= require('larvitbase')(customOptions);
	returnObj.customOptions	= customOptions;

	returnObj.on('httpSession', function (req, res) {
		const	originalRunController	= res.runController;

		if (customOptions.langs) {
			res.langs	= customOptions.langs;
		}

		// Default admin rights to be false
		// In the bottom this gets set to true if a correct user is logged in
		res.adminRights = false;

		// Make ACL object available for other parts of the system
		req.acl	= acl;

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

	runServer.instances.push(returnObj);

	return returnObj;
}

runServer.instances	= [];

exports = module.exports = runServer;
