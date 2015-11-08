'use strict';

var log           = require('winston'),
    utils         = require('./utils'),
    router        = require('larvitrouter')();

function middleware(request, response, callback) {
	response.globalData = {};

	// Default admin rights to be false
	// In the bottom this gets set to true if a correct user is logged in
	response.adminRights = false;

	// Include menu structure config
	response.globalData.menuStructure = require(router.fileExists('config/menuStructure.json'));

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

	// Set the logged in user
	utils.getUserFromSession(request, function(err, user) {
		if (user) {
			log.debug('larvitadmingui: models/controllerGlobal.js - User found in session. UserUuid: "' + user.uuid + '"');

			if (user.fields && user.fields.role && user.fields.role.indexOf('admin') !== - 1) {
				log.debug('larvitadmingui: models/controllerGlobal.js - User have admin role set, setting adminRights to true');
				response.adminRights = true;
			}

			response.globalData.user = user;
		}

		callback(err);
	});
}

exports.middleware = function() {
	return middleware;
};