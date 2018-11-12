'use strict';

const topLogPrefix = 'larvitadmingui: models/utils.js: ';
const querystring = require('querystring');
const url = require('url');

function getUserFromSession(req, cb) {
	const logPrefix = topLogPrefix + 'getUserFromSession() - ';

	req.log.silly(logPrefix + 'running');

	if (req.session.data.userUuid !== undefined) {
		req.log.debug(logPrefix + 'UserUuid: "' + req.session.data.userUuid + '" found in session');

		req.userLib.fromUuid(req.session.data.userUuid, function (err, user) {
			if (err) return cb(err);

			req.user = user;

			if (user.uuid !== undefined) {
				req.log.debug(logPrefix + 'UserUuid: "' + user.uuid + '" found in database');

				return cb(null, {
					'uuid': user.uuid,
					'username': user.username,
					'fields': user.fields
				});
			}

			cb();
		});
	} else {
		req.log.silly(logPrefix + 'No userUuid found in session');
		req.user = undefined;
		cb();
	}
};

function urlUtil() {};

urlUtil.setParam = function (currentUrl, params) {
	currentUrl = url.parse(currentUrl, true);

	for (const key in params) {
		currentUrl.query[key] = params[key];
	}

	currentUrl.search = querystring.stringify(currentUrl.query);

	return url.format(currentUrl);
};

urlUtil.removeParam = function (currentUrl, params) {
	currentUrl = url.parse(currentUrl, true);
	for (let i = 0; params[i] !== undefined; i ++) {
		delete currentUrl.query[params[i]];
	}
	currentUrl.search = querystring.stringify(currentUrl.query);

	return url.format(currentUrl);
};

exports.getUserFromSession = getUserFromSession;
exports.urlUtil = urlUtil;
