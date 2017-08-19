'use strict';

const	Acl	= require(__dirname + '/models/acl.js'),
	lfs	= require('larvitfs'),
	_	= require('lodash');

// Extend lodash
_.defaultsDeep	= require('lodash.defaultsdeep');
_.trim	= require('lodash.trim');

exports = module.exports = function (customOptions) {
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

		res.runController = function () {
			acl.checkAndRedirect(req, res, function (err, userGotAccess) {
				if (err) {
					throw err;
				}

				// User got access, proceed with executing the controller
				if (userGotAccess) {
					originalRunController();
				} else {
					// If userGotAccess is false, we should not execute the controller.
					// Instead just run sendToClient directly, circumventing the afterware as well.
					res.sendToClient(null, req, res);
				}
			});
		};

		res.next();
	});

	return returnObj;
};
