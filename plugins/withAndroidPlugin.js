const { withAndroidManifest } = require('expo/config-plugins');

const withAndroidPlugin = config => {
  // Define a custom message
  const message = 'Hello world, from Expo plugin!';

  return withAndroidManifest(config, config => {
    const mainApplication = config?.modResults?.manifest?.application?.[0];

    if (mainApplication) {
      // Ensure meta-data array exists
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }

      // Add the custom message as a meta-data entry
      mainApplication['meta-data'].push({
        $: {
          'android:name': 'HelloWorldMessage',
          'android:value': message,
        },
      });
    }

    return config;
  });
};

module.exports = withAndroidPlugin;
