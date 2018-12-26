var mongoose = require('mongoose');

var paDailyQty = mongoose.Schema({
	line: String,
	part: Number,
	cost: Number,
	coreprice: Number,
	superstock: Number,
	vendorstock: Number,
	rvcqty: Number,
	byqty: Number,
	bxqty: Number,
	dcqty: Number,
	azqty: Number,
	gaqty: Number
});

module.exports = mongoose.model('paDailyQty', paDailyQty);