const withAndroidPlugin = require('./withAndroidPlugin');
const withIosPlugin = require('./withIosPlugin');

const withPlugin = config => {
  // Apply Android modifications first
  config = withAndroidPlugin(config);
  // Then apply iOS modifications and return
  return withIosPlugin(config);
};

module.exports = withPlugin;
