'use strict';

const	topLogPrefix	= 'larvitadmingui: models/utils.js: ',
	querystring	= require('querystring'),
	userLib	= require('larvituser'),
	log	= require('winston'),
	url	= require('url');

function getUserFromSession(req, cb) {
	const	logPrefix	= topLogPrefix + 'getUserFromSession() - ';

	log.silly(logPrefix + 'running');

	if (req.session.data.userUuid !== undefined) {
		log.debug(logPrefix + 'UserUuid: "' + req.session.data.userUuid + '" found in session');

		userLib.fromUuid(req.session.data.userUuid, function (err, user) {
			if (err) return cb(err);

			req.user = user;

			if (user.uuid !== undefined) {
				log.debug(logPrefix + 'UserUuid: "' + user.uuid + '" found in database');

				return cb(null, {
					'uuid':	user.uuid,
					'username':	user.username,
					'fields':	user.fields
				});
			}

			cb();
		});
	} else {
		log.silly(logPrefix + 'No userUuid found in session');
		req.user = undefined;
		cb();
	}
};


function urlUtil(currentUrl) {
	this.currentUrl	= url.parse(currentUrl, true);
	this.formatedUrl	= currentUrl;
};

urlUtil.prototype.setParam = function (param, value) {
	this.currentUrl.query[param] = value;
	this.currentUrl.search = querystring.stringify(this.currentUrl.query);
	return url.format(this.currentUrl);
};

urlUtil.prototype.removeParam = function (param) {
	delete this.currentUrl.query[param];
	this.currentUrl.search = querystring.stringify(this.currentUrl.query);
	return url.format(this.currentUrl);
};

exports.getUserFromSession	= getUserFromSession;
exports.urlUtil	= urlUtil;
