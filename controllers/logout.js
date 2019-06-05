'use strict';

function run(req, res, cb) {
	delete req.session.data.userUuid;

	// Redirect to the login page
	res.statusCode = 302;
	res.setHeader('Location', '/');

	cb(null, req, res);
};

module.exports = run;
module.exports.run = run;
