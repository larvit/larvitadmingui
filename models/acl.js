'use strict';

const	topLogPrefix	= 'larvitadmingui: models/acl.js: ',
	log	= require('winston'),
	_	= require('lodash');

function Acl(options) {
	const	logPrefix	= topLogPrefix + 'Acl() - ',
		that	= this;

	if (options === undefined) {
		options = {};
	}

	_.defaultsDeep(options, options, {
		'redirectUnauthorizedTo':	'', // In the admin, the login page should be the default "" path
		'redirectLoggedInTo':	'home'
	});

	that.options	= options;

	log.debug(logPrefix + 'Setting up module instance with options: ' + JSON.stringify(options));
}

/**
 * Check and redirect a request
 *
 * @param obj req - standard request object, including urlParsed parameter
 * @param obj res - standard response object
 * @param func cb - callback(err, userGotAccess) - userGotAccess is a boolean
 */
Acl.prototype.checkAndRedirect = function checkAndRedirect(req, res, cb) {
	const	logPrefix	= topLogPrefix + 'Acl.prototype.checkAndRedirect() - ',
		that	= this;

	let	trimmedPathname;

	log.silly(logPrefix + 'Running.');

	trimmedPathname = _.trim(req.urlParsed.pathname, '/');
	if (trimmedPathname.substring(- 5) === '.json') {
		trimmedPathname	= trimmedPathname.substring(0, trimmedPathname.length - 5);
	}

	function redirectUnauthorized() {
		res.statusCode = 302;

		if (that.options.redirectUnauthorizedTo === '') {
			res.setHeader('Location', '/');
		} else {
			res.setHeader('Location', that.options.redirectUnauthorizedTo);
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
	if (that.options.publicPaths !== undefined && that.options.publicPaths.indexOf(trimmedPathname) !== - 1) {
		log.debug(logPrefix + 'Access granted. Pathname "' + trimmedPathname + '" is in the public paths array');
		return cb(null, true);
	}

	// Always redirect to that.options.redirectUnauthorizedTo if not logged in
	if (( ! res.globalData.user || ! res.globalData.user.fields || ! res.globalData.user.fields.role || res.globalData.user.fields.role.indexOf('admin') === - 1) && trimmedPathname !== that.options.redirectUnauthorizedTo) {
		log.verbose(logPrefix + 'Access denied. No valid user set and pathname: "' + trimmedPathname + '" is not the login url: "' + that.options.redirectUnauthorizedTo + '"');
		return redirectUnauthorized();
	}

	if ( ! res.globalData.user && trimmedPathname === that.options.redirectUnauthorizedTo) {
		log.debug(logPrefix + 'Access granted. No valid user set and pathname is the login url');
		return cb(null, true);
	}

	if (res.globalData.user && res.globalData.user.fields.role && res.globalData.user.fields.role.indexOf('admin') !== - 1 && trimmedPathname === that.options.redirectUnauthorizedTo) {
		log.debug(logPrefix + 'Access granted. Valid user logged in, but redirecting from login page.');
		res.statusCode	= 302;
		res.setHeader('Location',	that.options.redirectLoggedInTo);
		return cb(null, true);
	}

	if (res.globalData.user && res.globalData.user.fields.role && res.globalData.user.fields.role.indexOf('admin') !== - 1) {
		log.debug(logPrefix + 'Access granted. Valid user logged in.');
		return cb(null, true);
	}

	// Default to no access false
	log.verbose(logPrefix + 'Access denied. No rules matched.');
	res.statusCode	= 403;
	cb(null, false);
};

exports = module.exports = Acl;
