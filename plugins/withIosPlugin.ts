import configPlugins from 'expo/config-plugins.js';

const { withInfoPlist } = configPlugins;

const withIosPlugin = config => {
  // Define the custom message
  const message = 'Hello world, from Expo plugin!';

  return withInfoPlist(config, config => {
    // Add the custom message to the Info.plist file
    config.modResults.HelloWorldMessage = message;
    return config;
  });
};

export default withIosPlugin;
