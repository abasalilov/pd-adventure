var mongoose = require('mongoose');

var reset = mongoose.Schema({
	_userId: mongoose.Schema.Types.ObjectId,
	code: String,
	expires: Date
});

module.exports = mongoose.model('reset', reset);