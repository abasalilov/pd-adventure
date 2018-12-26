var models = require("../models"),
  bcrypt = require("bcrypt"),
  jwt = require("jwt-simple"),
  moment = require("moment"),
  async = require("async");

var user = {
  create: function(data, callback) {
    var user = new models.user(data);

    user.email = user.email.toLowerCase();
    user.password = bcrypt.hashSync(data.password, 10);
    user.mode = "LIVE";

    async.series(
      [
        function(callback) {
          models.user
            .findOne({
              email: user.email
            })
            .exec(function(err, record) {
              if (err) return callback("An error occurred");
              if (record) return callback("That email is not available");

              user.save(callback);
            });
        },
        function(callback) {
          var expires = moment()
              .add("years", 1)
              .valueOf(),
            token = jwt.encode(
              {
                iss: user._id,
                exp: expires
              },
              process.env.TOKEN_SECRET
            );

          user.api = {
            token: token,
            expires: expires
          };

          user.save(callback);
        }
      ],
      function(err) {
        if (err) {
          try {
            if (user._id) user.remove();
          } catch (err) {}
          return callback(new Error(err));
        }

        callback(null, user);
      }
    );
  },
  update: function(userId, data, user, callback) {
    if (!user._id.equals(userId)) return callback("Invalid User");

    async.series(
      [
        function(callback) {
          if (data.email.toLowerCase() == user.email) return callback();

          models.user
            .findOne({
              email: data.email.toLowerCase()
            })
            .exec(function(err, record) {
              if (err) return callback(err);
              if (record) return callback("That email is not available");

              return callback();
            });
        },
        function(callback) {
          user.name = data.name;
          user.email = data.email;
          user.address1 = data.address1;
          user.address2 = data.address2;
          user.city = data.city;
          user.state = data.state;
          user.zip = data.zip;
          user.providers = data.providers;
          user.autozone = data.autozone;
          user.partsAuthority = data.partsAuthority;
          user.advanceAuto = data.advanceAuto;

          user.save(callback);
        }
      ],
      function(err) {
        if (err) return callback(new Error(err));

        callback(null, user);
      }
    );
  },
  verify: function(data, callback) {
    models.user
      .findOne({
        email: data.email.toLowerCase()
      })
      .exec(function(err, record) {
        if (err) return callback(new Error(err));
        if (!record) return callback(new Error("Login Failed"));
        if (!bcrypt.compareSync(data.password, record.password))
          return callback(new Error("Login Failed"));

        return callback(null, record);
      });
  },
  checkIfEmailExists: function(data, callback) {
    models.user
      .findOne({ email: data.email.toLowerCase() })
      .exec(function(err, record) {
        if (err) return callback(new Error(err));

        callback(null, record);
      });
  },
  getByEmail: function(email, callback) {
    models.user.findOne({ email: email }, function(err, record) {
      if (err) return callback(new Error(err));

      callback(null, record);
    });
  },
  get: function(id, callback) {
    models.user.findById(id, function(err, record) {
      console.log("err", err);
      console.log("record", record);
      if (err) return callback(new Error(err));

      callback(null, record);
    });
  },
  updatePassword: function(id, password, callback) {
    this.get(id, function(err, user) {
      if (err) return callback(err);

      user.password = bcrypt.hashSync(password, 10);
      user.save(function(err) {
        if (err) return callback(new Error(err));

        callback(null, user);
      });
    });
  }
};

module.exports = user;
