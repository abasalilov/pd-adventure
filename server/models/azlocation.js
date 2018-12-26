var mongoose = require('mongoose');

var azlocation = mongoose.Schema({
	storeNumber : String,
	address : String,
	city : String,
	state : String,
	zipCode : String,
	phoneNumber : String,
	latitude : String,
	longitude : String,
	accuracy : String,
	geoAccuracy: String,
	location: {
		'type'     : { type: String, default: "Point" },
		coordinates: [
			{type: "Number", index: '2dsphere'}
		]
	}
});

module.exports = mongoose.model('azlocation', azlocation);