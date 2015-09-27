'use strict';

var userLib = require('larvituser'),
    log     = require('winston');

exports.run = function(request, response, callback) {
	var data = {};

	if (request.formFields !== undefined && request.formFields.username !== undefined && request.formFields.password !== undefined) {
		log.verbose('larvitadmingui: Login form POSTed, username: "' + request.formFields.username + '"');

		userLib.fromUserAndPass(request.formFields.username, request.formFields.password, function(err, user) {
			if (err) {
				throw err;
			}

			if ( ! user) {
				log.verbose('larvitadmingui: Wrong username and/or password for username: "' + request.formFields.username + '"');
				response.statusCode = 401; // Unauthorized
				data.formErrors     = ['Wrong username or password'];
				data.formFields     = request.formFields;
				delete data.formFields.passowrd;

				callback(null, request, response, data);
			} else {
				log.info('larvitadmingui: Username "' + request.formFields.username + '" logged in');
				request.session.data.userUuid = user.uuid;

				response.statusCode = 302;
				response.setHeader('Location', '/home');

				callback(null, request, response, data);
			}
		});

		return;
	}

	callback(null, request, response, data);
};