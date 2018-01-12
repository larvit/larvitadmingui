'use strict';

const	topLogPrefix	= 'larvitadmingui: server.js: ',
	Acl	= require(__dirname + '/models/acl.js'),
	lfs	= require('larvitfs'),
	log	= require('winston'),
	_	= require('lodash');

// Extend lodash
_.defaultsDeep	= require('lodash.defaultsdeep');
_.urlUtil	= require(__dirname + '/models/utils.js').urlUtil;
_.trim	= require('lodash.trim');

function runServer(customOptions) {
	const	logPrefix	= topLogPrefix + 'runServer() - ';

	let	returnObj,
		acl;

	if (customOptions === undefined) {
		customOptions = {};
	}

	if (customOptions.userApiUrl === undefined) {
		const	err	= new Error('userApiUrl is missing');
		return cb(err);
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
