var env = process.env.NODE_ENV || 'development'; // for heroku deploy


if (env === 'development' || env === 'test') {
    var config = require('./config.json');
    var envConfig = config[env];
    
    Object.keys(envConfig).forEach((key) => {
        // loops through the env Object to copy the setting values from config.json to process.env
        process.env[key] = envConfig[key]
    });
}

