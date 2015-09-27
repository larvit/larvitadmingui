'use strict';

exports.run = function(request, response, callback) {
	delete request.session.data.userUuid;

	// Redirect to the login page
	response.statusCode = 302;
	response.setHeader('Location', '/');

	callback(null, request, response);
};