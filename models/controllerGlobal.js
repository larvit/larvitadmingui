'use strict';

const	topLogPrefix	= 'larvitadmingui: models/controllerGlobal.js: ',
	utils	= require('./utils'),
	lfs	= require('larvitfs'),
	log	= require('winston');

function middleware(req, res, cb) {
	if ( ! res.globalData) {
		res.globalData = {};
	}

	// Default admin rights to be false
	// In the bottom this gets set to true if a correct user is logged in
	res.adminRights = false;

	// Include menu structure config
	res.globalData.menuStructure = require(lfs.getPathSync('config/menuStructure.json'));

	// Include the domain in global data
	res.globalData.domain = req.headers.host;

	// Include referer
	res.globalData.referer	= req.headers.referer;

	// Include controller name in global data
	res.globalData.controllerName = req.routeResult.controllerName;

	// Include urlParsed in global data
	res.globalData.urlParsed = req.urlParsed;

	// Include form fields in global data
	if (req.formFields === undefined) {
		res.globalData.formFields = {};
	} else {
		res.globalData.formFields = req.formFields;
	}

	// Something went wrong with setting up the session
	if (req.session === undefined) {
		log.warn('larvitadmingui: models/controllerGlobal.js - No req.session found');
		return cb(null);
	}

	// Set the logged in user
	utils.getUserFromSession(req, function (err, user) {
		if (user) {
			log.debug(topLogPrefix + 'User found in session. UserUuid: "' + user.uuid + '"');

			if (user.fields && user.fields.role && user.fields.role.indexOf('admin') !== - 1) {
				log.debug(topLogPrefix + 'User have admin role set, setting adminRights to true');
				res.adminRights = true;
			}

			res.globalData.user = user;
		}

		cb(err);
	});
}

exports.middleware = function () {
	return middleware;
};
