var mongoose = require('mongoose');

var user = mongoose.Schema({
	name: String,
	email: String,
	password: String,
	api: {
		token: String,
		expires: Date
	},
	providers: [],
	autozone: {
		pin: String,
		phone: String
	},
	partsAuthority: {
		acctNumber: String,
		user: String,
		password: String
	},
	advanceAuto: {
		id: String,
		password: String,
		store: String
	},
	address1: String,
	address2: String,
	city: String,
	state: String,
	zip: String,
	mode: String
});

user.methods.toJSON = function() {
	var obj = this.toObject();

	delete obj.email;
	delete obj.password;
	delete obj.api;

	obj.providers = obj.providers || [];

	return obj;
};

user.methods.toFullJSON = function() {
	var obj = this.toObject();

	delete obj.password;

	obj.providers = obj.providers || [];

	return obj;
};

module.exports = mongoose.model('user', user);