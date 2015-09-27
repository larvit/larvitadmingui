'use strict';

var log   = require('winston'),
    utils = require('./utils');

function middleware(request, response, callback) {
	response.globalData = {};

	// Include the domain in global data
	response.globalData.domain = request.headers.host;

	// Include controller name in global data
	response.globalData.controllerName = request.controllerName;

	// Include urlParsed in global data
	response.globalData.urlParsed = request.urlParsed;

	// Include form fields in global data
	if (request.formFields === undefined) {
		response.globalData.formFields = {};
	} else {
		response.globalData.formFields = request.formFields;
	}

	// Something went wrong with setting up the session
	if (request.session === undefined) {
		log.warn('larvitadmingui: models/controllerGlobal.js - No request.session found');
		callback(null);
		return;
	}

	// Set forms part of session if it is not set
	//if (request.session.data.forms === undefined) {
	//	request.session.data.forms = {};
	//}

	// Set the logged in user
	utils.getUserFromSession(request, function(err, user) {
		if (user) {
			log.verbose('larvitadmingui: models/controllerGlobal.js - User found in session. UserUuid: "' + user.uuid + '"');
			response.globalData.user = user;
		}

		callback(err);
	});
}

exports.middleware = function() {
	return middleware;
};