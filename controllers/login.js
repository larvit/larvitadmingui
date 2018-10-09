'use strict';

const	topLogPrefix	= 'larvitadmingui: controllers/login.js: ';

module.exports = function run(req, res, cb) {
	const	logPrefix	= topLogPrefix + 'run() - ';

	res.data	= {'global': res.globalData};

	if (req.formFields !== undefined && req.formFields.username !== undefined && req.formFields.password !== undefined) {
		req.log.verbose(logPrefix + 'Login form POSTed, username: "' + req.formFields.username + '"');

		req.userLib.fromUserAndPass(req.formFields.username, req.formFields.password, function (err, user) {
			if (err) {
				return cb(err, req, res);
			}

			if (! user) {
				req.log.verbose(logPrefix + 'Wrong username and/or password for username: "' + req.formFields.username + '"');
				res.statusCode  = 401; // Unauthorized
				res.data.formErrors = ['Wrong username or password'];
				res.data.formFields = req.formFields;

				delete res.data.formFields.passowrd;

				return cb(null, req, res);
			}

			req.acl.checkAndRedirect(req, res, function (err, userGotAccess) {
				if (err) return cb(err, req, res, data);

				if (! userGotAccess) {
					req.log.verbose(logPrefix + 'acl.gotAccessTo() returned false for username: "' + req.formFields.username + '"');
					res.statusCode  = 401; // Unauthorized
					res.data.formErrors = ['Invalid rights'];
					res.data.formFields = req.formFields;

					delete res.data.formFields.passowrd;

					return cb(null, req, res);
				}

				req.log.info(logPrefix + 'Username "' + req.formFields.username + '" logged in');
				req.session.data.userUuid	= user.uuid;
				res.statusCode	= 302;
				res.setHeader('Location', '/home');

				return cb(null, req, res);
			});
		});

		return;
	}

	return cb(null, req, res);
};
