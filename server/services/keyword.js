var keywords = require('../keywords.json');

var keyword = {
	getAll: function(callback) {
		callback(null, keywords.main);
	}
};

module.exports = keyword;