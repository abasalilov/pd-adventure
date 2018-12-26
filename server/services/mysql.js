var mysql = require('mysql'),
	pool;

module.exports = {
	init: function() {
		pool  = mysql.createPool({
			host: process.env.MYSQL_HOST,
			user: process.env.MYSQL_USER,
			password: process.env.MYSQL_PASSWORD,
			multipleStatements: true
		});
	},
	getConnection: function(callback) {
		pool.getConnection(callback);
	}
};

