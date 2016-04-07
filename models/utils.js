'use strict';

const userLib = require('larvituser'),
      log     = require('winston');

exports.getUserFromSession = function(req, cb) {
	log.silly('larvitadmingui: models/utils.js: getUserFromSession() - running');

	if (req.session.data.userUuid !== undefined) {
		log.debug('larvitadmingui: models/utils.js: getUserFromSession() - UserUuid: "' + req.session.data.userUuid + '" found in session');

		userLib.fromUuid(req.session.data.userUuid, function(err, user) {
			if (err) {
				cb(err);
				return;
			}

			req.user = user;

			if (user.uuid !== undefined) {
				log.debug('larvitadmingui: models/utils.js: getUserFromSession() - UserUuid: "' + user.uuid + '" found in database');

				cb(null, {
					'uuid':     user.uuid,
					'username': user.username,
					'fields':   user.fields
				});

				return;
			}

			cb();
		});
	} else {
		log.silly('larvitadmingui: models/utils.js: getUserFromSession() - No userUuid found in session');
		req.user = undefined;
		cb();
	}
};