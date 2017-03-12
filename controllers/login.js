'use strict';

const	userLib	= require('larvituser'),
	log	= require('winston');

exports.run = function(req, res, cb) {
	const	data	= {'global': res.globalData};

	if (req.formFields !== undefined && req.formFields.username !== undefined && req.formFields.password !== undefined) {
		log.verbose('larvitadmingui: Login form POSTed, username: "' + req.formFields.username + '"');

		userLib.fromUserAndPass(req.formFields.username, req.formFields.password, function(err, user) {
			if (err) {
				throw err;
			}

			if ( ! user) {
				log.verbose('larvitadmingui: Wrong username and/or password for username: "' + req.formFields.username + '"');
				res.statusCode  = 401; // Unauthorized
				data.formErrors = ['Wrong username or password'];
				data.formFields = req.formFields;
				delete data.formFields.passowrd;

				cb(null, req, res, data);
			} else {
				log.info('larvitadmingui: Username "' + req.formFields.username + '" logged in');
				req.session.data.userUuid = user.uuid;

				res.statusCode = 302;
				res.setHeader('Location', '/home');

				cb(null, req, res, data);
			}
		});

		return;
	}

	cb(null, req, res, data);
};
