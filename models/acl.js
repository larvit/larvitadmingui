'use strict';

const topLogPrefix = 'larvitadmingui: models/acl.js: ';
const LUtils = require('larvitutils');
const url = require('url');
const db = require('larvitdb');
const _ = require('lodash');

function Acl(options) {
	const logPrefix = topLogPrefix + 'Acl() - ';
	const that = this;

	if (options === undefined) {
		options = {};
	}

	if (!options.log) {
		const lUtils = new LUtils();

		options.log = new lUtils.Log();
	}

	_.defaultsDeep(options, options, {
		redirectUnauthorizedTo: '', // In the admin, the login page should be the default "" path
		redirectLoggedInTo: 'home'
	});

	that.options = options;
	that.log = options.log;

	that.log.debug(logPrefix + 'Setting up module instance');
}

/**
 * Check and redirect a request
 *
 * @param {obj} req - standard request object, including urlParsed parameter
 * @param {obj} res - standard response object
 * @param {func} cb - callback(err, userGotAccess) - userGotAccess is a boolean
 * @returns {obj} Callback function return result on early return from function
 */
Acl.prototype.checkAndRedirect = function checkAndRedirect(req, res, cb) {
	const logPrefix = topLogPrefix + 'Acl.prototype.checkAndRedirect() - ';
	const that = this;

	let trimmedPathname;

	that.log.silly(logPrefix + 'Running.');

	trimmedPathname = _.trim(req.urlParsed.pathname, '/');
	if (trimmedPathname.substring(-5) === '.json') {
		trimmedPathname = trimmedPathname.substring(0, trimmedPathname.length - 5);
	}

	if (res.globalData.user && trimmedPathname === '') {
		res.statusCode = 302;
		res.setHeader('Location', that.options.redirectLoggedInTo);

		return cb(null, true);
	}

	that.gotAccessTo(res.globalData.user, req, function (err, result) {
		if (err) return cb(err);

		if (result && trimmedPathname === that.options.redirectUnauthorizedTo && res.globalData.user) {
			that.log.debug(logPrefix + 'Access granted. Valid user logged in, but redirecting from login page.');
			res.statusCode = 302;
			res.setHeader('Location', that.options.redirectLoggedInTo);

			return cb(null, true);
		} else if (result) {
			that.log.debug(logPrefix + 'Access granted.');

			return cb(null, true);
		} else if (trimmedPathname !== that.options.redirectUnauthorizedTo && !res.globalData.user) {
			res.statusCode = 302;
			if (that.options.redirectUnauthorizedTo === '') {
				res.setHeader('Location', '/');
			} else {
				res.setHeader('Location', that.options.redirectUnauthorizedTo);
			}

			return cb(null, false);
		}

		// Default to no access false
		that.log.verbose(logPrefix + 'Access denied. No rules matched.');
		res.statusCode = 403;
		cb(null, false);
	});
};

/**
 * Check if user got access to request
 *
 * @param {obj} user - user object from larvituser
 * @param {obj} req - standard request object from node http server or URL string, after the domain. For example /home or / or /foo/bar
 * @param {func} cb - function (err, result) - result is a boolean
 * @returns {obj} Callback function return result on early return from function
 */
Acl.prototype.gotAccessTo = function (user, req, cb) {
	const logPrefix = topLogPrefix + 'Acl.prototype.gotAccessTo() - ';
	const that = this;

	let trimmedPathname;

	if (typeof req === 'string') {
		req = {orgReqStr: req};
		req.urlParsed = url.parse('http://somehost' + req.orgReqStr, true);
	}

	trimmedPathname = _.trim(req.urlParsed.pathname, '/');
	if (trimmedPathname.substring(-5) === '.json') {
		trimmedPathname = trimmedPathname.substring(0, trimmedPathname.length - 5);
	}

	// Always allow access to static files
	if (req.routeResult !== undefined && req.routeResult.staticFilename !== undefined) {
		that.log.debug(logPrefix + 'Access granted. Static file requested: "' + req.routeResult.staticFilename + '"');

		return cb(null, true);
	}

	// Always allow access to css files
	if (RegExp('\\.css$').test(req.urlParsed.pathname)) {
		that.log.debug(logPrefix + 'Access granted, is css file.');

		return cb(null, true);
	}

	// Give access to configured public paths
	if (that.options.publicPaths !== undefined && that.options.publicPaths.indexOf(trimmedPathname) !== -1) {
		that.log.debug(logPrefix + 'Access granted. Pathname "' + trimmedPathname + '" is in the public paths array.');

		return cb(null, true);
	}

	if (!user && trimmedPathname === that.options.redirectUnauthorizedTo) {
		that.log.debug(logPrefix + 'Access granted. No valid user set and pathname is the login url.');

		return cb(null, true);
	}

	if (!user || !user.fields || !Array.isArray(user.fields.role)) {
		that.log.debug(logPrefix + 'Access denied. No user set or user has no roles and pathname is not the login url.');

		return cb(null, false);
	}

	// Hard coded access to logout page when logged in
	if (user && trimmedPathname === 'logout') {
		that.log.debug(logPrefix + 'Access granted. User is logged in and trying to log out.');

		return cb(null, true);
	}

	// If we get down here, we have a logged in user and pathname is not the login url.
	// Lets see if the logged in users roles give it access
	db.query('SELECT * FROM user_roles_rights', function (err, rows) {
		if (err) return cb(err, false);

		for (let i = 0; rows[i] !== undefined; i++) {
			const row = rows[i];

			for (let i = 0; user.fields.role[i] !== undefined; i++) {
				const role = user.fields.role[i];

				if (role === row.role) {
					const matches = trimmedPathname.match(new RegExp(row.uri, 'g'));
					if (matches) {
						that.log.debug(logPrefix + 'Access granted. Matched regex: "' + row.uri + '" for uri: "' + trimmedPathname + '" for role: "' + role + '"');

						return cb(null, true);
					}
				}
			}
		}

		that.log.verbose(logPrefix + 'Access denied. No matching rules found for logged in user.');

		return cb(null, false); // No rules was matched
	});
};

exports = module.exports = Acl;
