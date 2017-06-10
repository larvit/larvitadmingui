'use strict';

const	topLogPrefix	= 'larvitadmingui: models/acl.js: ',
	log	= require('winston'),
	_	= require('lodash');

exports = module.exports = function (options) {
	const returnObj = {};

	if (options === undefined) {
		options = {};
	}

	_.defaultsDeep(options, options, {
		'redirectUnauthorizedTo':	'', // In the admin, the login page should be the default "" path
		'redirectLoggedInTo':	'home'
	});

	log.debug(topLogPrefix + 'Setting up module instance with options: ' + JSON.stringify(options));

	/**
	 * Check and redirect a request
	 *
	 * @param obj req - standard request object, including urlParsed parameter
	 * @param obj res - standard response object
	 * @param func cb - callback(err, userGotAccess) - userGotAccess is a boolean
	 */
	returnObj.checkAndRedirect = function (req, res, cb) {
		const	logPrefix	= topLogPrefix + 'checkAndRedirect() - ';

		let	trimmedPathname;

		log.silly(logPrefix + 'Running.');

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
			log.debug(logPrefix + 'Access granted. Static file requested: "' + req.routeResult.staticFilename + '"');
			return cb(null, true);
		}

		// Always allow access to css files
		if (RegExp('\\.css$').test(req.urlParsed.pathname)) {
			log.debug(logPrefix + 'Access granted, is css file.');
			return cb(null, true);
		}

		// Give access to configured public paths
		if (options.publicPaths !== undefined && options.publicPaths.indexOf(trimmedPathname) !== - 1) {
			log.debug(logPrefix + 'Access granted. Pathname "' + trimmedPathname + '" is in the public paths array');
			return cb(null, true);
		}

		// Always redirect to options.redirectUnauthorizedTo if not logged in
		if (( ! res.globalData.user || ! res.globalData.user.fields || ! res.globalData.user.fields.role || res.globalData.user.fields.role.indexOf('admin') === - 1) && trimmedPathname !== options.redirectUnauthorizedTo) {
			log.verbose(logPrefix + 'Access denied. No valid user set and pathname: "' + trimmedPathname + '" is not the login url: "' + options.redirectUnauthorizedTo + '"');
			return redirectUnauthorized();
		}

		if ( ! res.globalData.user && trimmedPathname === options.redirectUnauthorizedTo) {
			log.debug(logPrefix + 'Access granted. No valid user set and pathname is the login url');
			return cb(null, true);
		}

		if (res.globalData.user && res.globalData.user.fields.role && res.globalData.user.fields.role.indexOf('admin') !== - 1 && trimmedPathname === options.redirectUnauthorizedTo) {
			log.debug(logPrefix + 'Access granted. Valid user logged in, but redirecting from login page.');
			res.statusCode = 302;
			res.setHeader('Location', options.redirectLoggedInTo);
			return cb(null, true);
		}

		if (res.globalData.user && res.globalData.user.fields.role && res.globalData.user.fields.role.indexOf('admin') !== - 1) {
			log.debug(logPrefix + 'Access granted. Valid user logged in.');
			return cb(null, true);
		}

		// Default to no access false
		log.verbose(logPrefix + 'Access denied. No rules matched.');
		res.statusCode = 403;
		cb(null, false);
	};

	return returnObj;
};
