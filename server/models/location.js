var mongoose = require('mongoose');

var location = mongoose.Schema({
	location: {
		'type'     : { type: String, default: "Point" },
		coordinates: [
			{type: "Number", index: '2dsphere'}
		]
	},
	address: String,
	phone: String,
	name: String,
	type: String
});

module.exports = mongoose.model('location', location);