'use strict';

module.exports = function (req, res, cb) {
	delete req.session.data.userUuid;

	// Redirect to the login page
	res.statusCode	= 302;
	res.setHeader('Location', '/');

	cb(null, req, res);
};
