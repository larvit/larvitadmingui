'use strict';

const	topLogPrefix	= 'larvitadmingui: models/utils.js: ',
	userLib	= require('larvituser'),
	log	= require('winston');

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

exports.getUserFromSession	= getUserFromSession;
