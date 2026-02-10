const { withAndroidManifest } = require('expo/config-plugins');

const withAndroidPlugin = config => {
  return withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;

    // Ensure uses-permission array exists
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    // Add RECORD_AUDIO permission
    const recordAudioPermission = manifest['uses-permission'].find(
      permission => permission.$['android:name'] === 'android.permission.RECORD_AUDIO'
    );
    if (!recordAudioPermission) {
      manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.RECORD_AUDIO',
        },
      });
    }

    // Add FOREGROUND_SERVICE permission
    const foregroundServicePermission = manifest['uses-permission'].find(
      permission => permission.$['android:name'] === 'android.permission.FOREGROUND_SERVICE'
    );
    if (!foregroundServicePermission) {
      manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.FOREGROUND_SERVICE',
        },
      });
    }

    // Add FOREGROUND_SERVICE_MICROPHONE permission
    const foregroundServiceMicrophonePermission = manifest['uses-permission'].find(
      permission => permission.$['android:name'] === 'android.permission.FOREGROUND_SERVICE_MICROPHONE'
    );
    if (!foregroundServiceMicrophonePermission) {
      manifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.FOREGROUND_SERVICE_MICROPHONE',
        },
      });
    }

    // Add foreground service type to application
    const mainApplication = manifest.application?.[0];
    if (mainApplication) {
      // Ensure meta-data array exists for application
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }

      // Add notification channel metadata
      const notificationChannelMeta = mainApplication['meta-data'].find(
        meta => meta.$['android:name'] === 'audio_recording_notification_channel_id'
      );
      if (!notificationChannelMeta) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'audio_recording_notification_channel_id',
            'android:value': 'audio_recording_channel',
          },
        });
        
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'audio_recording_notification_channel_name',
            'android:value': 'Audio Recording',
          },
        });
        
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'audio_recording_notification_channel_description',
            'android:value': 'Notifications for audio recording service',
          },
        });
      }

      // Ensure service array exists
      if (!mainApplication.service) {
        mainApplication.service = [];
      }

      // Add a service with foregroundServiceType for microphone
      const existingMicrophoneService = mainApplication.service.find(
        service => service.$?.['android:foregroundServiceType']?.includes('microphone')
      );
      
      if (!existingMicrophoneService) {
        mainApplication.service.push({
          $: {
            'android:name': '.AudioRecordingService',
            'android:foregroundServiceType': 'microphone',
            'android:enabled': 'true',
            'android:exported': 'false'
          },
        });
      }
    }

    return config;
  });
};

module.exports = withAndroidPlugin;
