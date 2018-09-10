var mongoose = require('mongoose');

mongoose.Promise = global.Promise; // set up for promises

// for heroku || local host
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ResumeApp', {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
    useMongoClient: true
  }); // for local host


module.exports = {
    mongoose: mongoose
};