'use strict';

var _   = require('lodash'),
    log = require('winston');

exports = module.exports = function(options) {
	var returnObj = {};

	if (options === undefined) {
		options = {};
	}

	_.defaultsDeep(options, options, {
		'redirectUnauthorizedTo': '', // In the admin, the login page should be the default "" path
		'redirectLoggedInTo': 'home'
	});

	log.debug('larvitadmingui: models/acl.js: Setting up module instance with options: ' + JSON.stringify(options));

	/**
	 * Check and redirect a request
	 *
	 * @param obj request - standard request object, including urlParsed parameter
	 * @param obj response - standard response object
	 * @param func cb - callback(err, userGotAccess) - userGotAccess is a boolean
	 */
	returnObj.checkAndRedirect = function(request, response, cb) {
		var trimmedPathname;

		log.silly('larvitadmingui: checkAndRedirect() - Running.');

		trimmedPathname = _.trim(request.urlParsed.pathname, '/');
		if (trimmedPathname.substring(- 5) === '.json') {
			trimmedPathname = trimmedPathname.substring(0, trimmedPathname.length - 5);
		}

		function redirectUnauthorized() {
			response.statusCode = 302;

			if (options.redirectUnauthorizedTo === '') {
				response.setHeader('Location', '/');
			} else {
				response.setHeader('Location', options.redirectUnauthorizedTo);
			}

			cb(null, false);
		}

		// Always allow access to static files
		if (request.staticFilename !== undefined) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Static file requested: "' + request.staticFilename + '"');
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
		if (( ! response.globalData.user || (response.globalData.user && response.globalData.user.fields.role.indexOf('admin') === - 1)) && trimmedPathname !== options.redirectUnauthorizedTo) {
			log.verbose('larvitadmingui: models/acl.js: checkAndRedirect() - Access denied. No valid user set and pathname: "' + trimmedPathname + '" is not the login url: "' + options.redirectUnauthorizedTo + '"');
			redirectUnauthorized();
			return;
		}

		if ( ! response.globalData.user && trimmedPathname === options.redirectUnauthorizedTo) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. No valid user set and pathname is the login url');
			cb(null, true);
			return;
		}

		if (response.globalData.user && response.globalData.user.fields.role.indexOf('admin') !== - 1 && trimmedPathname === options.redirectUnauthorizedTo) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Valid user logged in, but redirecting from login page.');
			response.statusCode = 302;
			response.setHeader('Location', options.redirectLoggedInTo);
			cb(null, true);
			return;
		}

		if (response.globalData.user && response.globalData.user.fields.role.indexOf('admin') !== - 1) {
			log.debug('larvitadmingui: models/acl.js: checkAndRedirect() - Access granted. Valid user logged in.');
			cb(null, true);
			return;
		}

		// Default to no access false
		log.verbose('larvitadmingui: models/acl.js: checkAndRedirect() - Access denied. No rules matched.');
		response.statusCode = 403;
		cb(null, false);
	};

	return returnObj;
};