'use strict';

exports.run = function(request, response, callback) {
	var data = {'global': response.globalData};

	callback(null, request, response, data);
};