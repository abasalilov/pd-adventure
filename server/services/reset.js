var models = require('../models'),
	services = require('../services'),
	shortid = require('shortid'),
	async = require('async'),
	moment = require('moment');

var reset = {
	create: function(email, callback) {
		services.user.getByEmail(email, function(err, user) {
			if (err) return callback(err);
			if (!user) return callback(new Error('Invalid Email'));

			var reset = new models.reset();

			async.series([
				function(callback) {
					reset._userId = user._id;
					reset.code = shortid.generate();
					reset.expires = new moment().add(3, 'hours');

					reset.save(function(err) {
						if (err) return callback(err);

						callback();
					});
				},
				function(callback) {
					services.notify.resetPassword(reset, email, callback);
				}
			], function(err) {
				if (err) return callback(new Error(err));

				callback(null, reset);
			});
		});
	},
	updatePassword: function(code, data, callback) {
		models.reset.findOne({code: data.code}, function(err, reset) {
			if (err) return callback(err);
			if (!reset) return callback(new Error('Invalid Reset'));

			var now = moment();

			if (now.isAfter(reset.expires)) {
				var err = new Error('Reset has expired');

				err.code = 1;

				return callback(err);
			}

			services.user.updatePassword(reset._userId, data.password, callback);
		});
	}
};

module.exports = reset;