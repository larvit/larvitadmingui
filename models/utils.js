'use strict';

var userLib = require('larvituser'),
    log     = require('winston');

exports.getUserFromSession = function(request, callback) {
	log.silly('larvitadmingui: models/utils.js: getUserFromSession() - running');

	if (request.session.data.userUuid !== undefined) {
		log.debug('larvitadmingui: models/utils.js: getUserFromSession() - UserUuid: "' + request.session.data.userUuid + '" found in session');

		userLib.fromUuid(request.session.data.userUuid, function(err, user) {
			if (err) {
				callback(err);
				return;
			}

			request.user = user;

			if (user.uuid !== undefined) {
				log.debug('larvitadmingui: models/utils.js: getUserFromSession() - UserUuid: "' + user.uuid + '" found in database');

				callback(null, {
					'uuid':     user.uuid,
					'username': user.username,
					'fields':   user.fields
				});

				return;
			}

			callback();
		});
	} else {
		log.silly('larvitadmingui: models/utils.js: getUserFromSession() - No userUuid found in session');
		request.user = undefined;
		callback();
	}
};