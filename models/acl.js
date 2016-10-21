'use strict';

const log = require('winston'),
      _   = require('lodash');

exports = module.exports = function(options) {
	const returnObj = {};

	if (options === undefined) {
		options = {};
	}

	_.defaultsDeep(options, options, {
		'redirectUnauthorizedTo': '', // In the admin, the login page should be the default "" path
		'redirectLoggedInTo':     'home'
	});

	log.debug('larvitadmingui: models/acl.js: Setting up module instance with options: ' + JSON.stringify(options));

	/**
	 * Check and redirect a request
	 *
	 * @param obj req - standard request object, including urlParsed parameter
	 * @param obj res - standard response object
	 * @param func cb - callback(err, userGotAccess) - userGotAccess is a boolean
	 */
	returnObj.checkAndRedirect = function(req, res, cb) {
		var trimmedPathname;

		log.silly('larvitadmingui: checkAndRedirect() - Running.');

		trimmedPathname = _.trim(req.urlParsed.pathname, '/');
		if (trimmedPathname.substring(- 5) === '.json') {
			trimmedPathname = trimmedPathname.substring(0, trimmedPathname.length - 5);
		}

		function redirectUnauthorized() {
			res.statusCode = 302;

			if (options.redirectUnauthorizedTo === '') {
				res.setHeader('Location', '/');
			} else {
				res.setHeader('Location', options.redirectUnauthorizedTo);
			}

			cb(null, false);
		}

		// Always allow access to static files
		if (req.routeResult.staticFilename !== undefined) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Static file requested: "' + req.routeResult.staticFilename + '"');
			cb(null, true);
			return;
		}

		// Always allow access to css files
		if (RegExp('\\.css$').test(req.urlParsed.pathname)) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted, is css file.');
			cb(null, true);
			return;
		}

		// Give access to configured public paths
		if (options.publicPaths !== undefined && options.publicPaths.indexOf(trimmedPathname) !== - 1) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Pathname "' + trimmedPathname + '" is in the public paths array');
			cb(null, true);
			return;
		}

		// Always redirect to options.redirectUnauthorizedTo if not logged in
		if (( ! res.globalData.user || ! res.globalData.user.fields || ! res.globalData.user.fields.role || res.globalData.user.fields.role.indexOf('admin') === - 1) && trimmedPathname !== options.redirectUnauthorizedTo) {
			log.verbose('larvitadmingui: models/acl.js: checkAndRedirect() - Access denied. No valid user set and pathname: "' + trimmedPathname + '" is not the login url: "' + options.redirectUnauthorizedTo + '"');
			redirectUnauthorized();
			return;
		}

		if ( ! res.globalData.user && trimmedPathname === options.redirectUnauthorizedTo) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. No valid user set and pathname is the login url');
			cb(null, true);
			return;
		}

		if (res.globalData.user && res.globalData.user.fields.role && res.globalData.user.fields.role.indexOf('admin') !== - 1 && trimmedPathname === options.redirectUnauthorizedTo) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Valid user logged in, but redirecting from login page.');
			res.statusCode = 302;
			res.setHeader('Location', options.redirectLoggedInTo);
			cb(null, true);
			return;
		}

		if (res.globalData.user && res.globalData.user.fields.role && res.globalData.user.fields.role.indexOf('admin') !== - 1) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Valid user logged in.');
			cb(null, true);
			return;
		}

		// Default to no access false
		log.verbose('larvitadmingui: models/acl.js: checkAndRedirect() - Access denied. No rules matched.');
		res.statusCode = 403;
		cb(null, false);
	};

	return returnObj;
};
