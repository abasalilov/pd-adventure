var mongoose = require('mongoose');

var aapPart = mongoose.Schema({
	mfg: String,
	number: String,
	url: String,
	attempts: Array
});

module.exports = mongoose.model('aapPart', aapPart);