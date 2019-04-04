'use strict';

module.exports = function (req, res, cb) {
	res.data = {global: res.globalData};
	cb(null, req, res);
};
