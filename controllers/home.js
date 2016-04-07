'use strict';

exports.run = function(req, res, cb) {
	const data = {'global': res.globalData};

	cb(null, req, res, data);
};