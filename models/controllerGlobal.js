'use strict';

const	topLogPrefix	= 'larvitadmingui: models/controllerGlobal.js: ',
	async	= require('async'),
	utils	= require('./utils'),
	Lfs	= require('larvitfs'),
	lfs	= new Lfs(),
	log	= require('winston');

function middleware(req, res, cb) {
	const	logPrefix	= topLogPrefix + 'middleware() - ',
		tasks	= [];

	if ( ! res.globalData) {
		res.globalData	= {};
	}

	// Include menu structure config
	// Do it through stringify/parse to not screw up the original structure
	res.globalData.menuStructure	= JSON.parse(JSON.stringify(require(lfs.getPathSync('config/menuStructure.json'))));

	// Include the domain in global data
	res.globalData.domain	= req.headers.host;

	// Include referer
	res.globalData.referer	= req.headers.referer;

	// Include controller name in global data
	res.globalData.controllerName	= req.routeResult.controllerName;

	// Include urlParsed in global data
	res.globalData.urlParsed	= req.urlParsed;

	// Include form fields in global data
	if (req.formFields === undefined) {
		res.globalData.formFields	= {};
	} else {
		res.globalData.formFields	= req.formFields;
	}

	// Something went wrong with setting up the session
	if (req.session === undefined) {
		log.warn(logPrefix + 'No req.session found');
		return cb(null);
	}

	// Set the logged in user
	tasks.push(function (cb) {
		utils.getUserFromSession(req, function (err, user) {
			if (user) {
				log.debug(logPrefix + 'User found in session. UserUuid: "' + user.uuid + '"');

				res.globalData.user	= user;
			}

			cb(err);
		});
	});

	// Check if logged in user got access to menuStructure items
	tasks.push(function (cb) {
		const	tasks	= [];

		for (const groupName of Object.keys(res.globalData.menuStructure)) {
			for (let i = 0; res.globalData.menuStructure[groupName][i] !== undefined; i ++) {
				const	menuItem	= res.globalData.menuStructure[groupName][i];
				tasks.push(function (cb) {
					req.acl.gotAccessTo(res.globalData.user, menuItem.href, function (err, result) {
						menuItem.loggedInUserGotAccess	= result;
						cb(err);
					});
				});

				if (menuItem.subNav) {
					for (let i = 0; menuItem.subNav[i] !== undefined; i ++) {
						const	subMenuItem	= menuItem.subNav[i];

						tasks.push(function (cb) {
							req.acl.gotAccessTo(res.globalData.user, subMenuItem.href, function (err, result) {
								subMenuItem.loggedInUserGotAccess	= result;
								cb(err);
							});
						});
					}
				}
			}
		}

		async.parallel(tasks, cb);
	});

	async.series(tasks, cb);
}

exports.middleware = function () {
	return middleware;
};
