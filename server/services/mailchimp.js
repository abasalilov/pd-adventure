var request = require('request'),
	crypto = require('crypto'),
	async = require('async');

var mailchimp = {
	onSignup: function(user, callback) {
		var auth = "Basic " + new Buffer("anystring:" + process.env.MAILCHIMP_API_KEY).toString("base64");

		request({
			url: process.env.MAILCHIMP_API_URI + '/lists/' + process.env.MAILCHIMP_SIGNUP_LIST_ID + '/members',
			json: {
				email_address: user.email,
				status: 'subscribed'
			},
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': auth
			}
		}, function(err, response, body){
			if (err) return callback(new Error(err));

			callback();
		});
	}
};

module.exports = mailchimp;