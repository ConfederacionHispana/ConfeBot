// Set options as a parameter, environment variable, or rc file.
// eslint-disable-next-line no-global-assign
require('dotenv').config();
require = require('esm')(module/* , options */); // eslint-disable-line no-global-assign
module.exports = require('./src/index.js');
