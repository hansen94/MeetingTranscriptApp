const { withInfoPlist } = require('expo/config-plugins');

const withIosPlugin = config => {
  return withInfoPlist(config, config => {
    // Add UIBackgroundModes for audio
    config.modResults.UIBackgroundModes = ['audio'];
    
    // Add AVAudioSession category for recording
    config.modResults.AVAudioSessionCategory = 'record';
    
    // Add microphone usage description
    config.modResults.NSMicrophoneUsageDescription = 'Allow $(PRODUCT_NAME) to access your microphone.';
    
    return config;
  });
};

module.exports = withIosPlugin;
