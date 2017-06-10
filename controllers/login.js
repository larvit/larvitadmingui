'use strict';

const	topLogPrefix	= 'larvitadmingui: controllers/login.js: ',
	userLib	= require('larvituser'),
	log	= require('winston');

function run(req, res, cb) {
	const	logPrefix	= topLogPrefix + 'run() - ',
		data	= {'global': res.globalData};

	if (req.formFields !== undefined && req.formFields.username !== undefined && req.formFields.password !== undefined) {
		log.verbose(logPrefix + 'Login form POSTed, username: "' + req.formFields.username + '"');

		userLib.fromUserAndPass(req.formFields.username, req.formFields.password, function (err, user) {
			if (err) {
				return cb(err, req, res, data);
			}

			if ( ! user) {
				log.verbose(logPrefix + 'Wrong username and/or password for username: "' + req.formFields.username + '"');
				res.statusCode  = 401; // Unauthorized
				data.formErrors = ['Wrong username or password'];
				data.formFields = req.formFields;
				delete data.formFields.passowrd;

				return cb(null, req, res, data);
			}

			log.info(logPrefix + 'Username "' + req.formFields.username + '" logged in');
			req.session.data.userUuid	= user.uuid;
			res.statusCode	= 302;
			res.setHeader('Location', '/home');

			cb(null, req, res, data);
		});

		return;
	}

	cb(null, req, res, data);
};

exports.run	= run;
