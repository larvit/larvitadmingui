'use strict';

module.exports = function (req, res, cb) {
	res.data = {global: res.globalData};
	res.data.global.menuControllerName = 'home';
	cb(null, req, res);
};
