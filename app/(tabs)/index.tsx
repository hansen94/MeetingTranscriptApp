import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { uploadRecording } from "../../services/recordingServices";

const HomeScreen = () => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const audioPlayer = useAudioPlayer();
  const playerState = useAudioPlayerStatus(audioPlayer);
  const [recordingStartTime, setRecordingStartTime] = useState<string>("");
  const [lastRecordingPath, setLastRecordingPath] = useState<string | null>(null);

  useEffect(() => {
    setupAudioAndPermissions();
  }, []);

  const setupAudioAndPermissions = async () => {
    try {
      // Request recording permissions
      const permissionResult = await requestRecordingPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Audio recording permission is required to record voice.");
        return;
      }

      // Set up audio mode for recording and background playback
      await setAudioModeAsync({
        allowsRecording: true,
        allowsBackgroundRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });

      console.log("Audio setup and permissions configured successfully");
    } catch (error) {
      console.error("Failed to setup audio and permissions:", error);
    }
  };

  const formatDateTime = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  };

  const startRecording = async () => {
    try {
      console.log("Starting recording...");

      const startTime = formatDateTime();
      setRecordingStartTime(startTime);

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      console.log("Recording started successfully");
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Recording Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      console.log("Stopping recording...");

      await audioRecorder.stop();

      if (audioRecorder.uri) {
        const fileName = `recording_${recordingStartTime}.m4a`;
        const destinationFile = new File(Paths.document, fileName);
        const sourceFile = new File(audioRecorder.uri);

        // Move the recorded file to a permanent location with the desired filename
        sourceFile.copy(destinationFile);
        setLastRecordingPath(destinationFile.uri);

        console.log(`Recording saved to: ${destinationFile.uri}`);

        // Upload the recording to the backend
        try {
          const uploadResult = await uploadRecording(destinationFile.uri, fileName);
          console.log('Upload successful:', uploadResult);
          Alert.alert(
            "Recording Uploaded",
            `Recording saved as ${fileName} and uploaded successfully.\nRecording ID: ${uploadResult.recording_id}`
          );
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          Alert.alert(
            "Upload Failed",
            `Recording saved as ${fileName} but upload failed. Please try again later.`
          );
        }
      } else {
        console.log("No recording URI available");
        Alert.alert("Recording Error", "No recording was created.");
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      Alert.alert("Recording Error", "Failed to save recording. Please try again.");
    }
  };

  const handleRecord = async () => {
    if (recorderState.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const playLastRecording = async () => {
    if (!lastRecordingPath) {
      Alert.alert("No Recording", "No recording available to play. Please record something first.");
      return;
    }

    try {
      audioPlayer.replace(lastRecordingPath);
      audioPlayer.play();
      console.log("Playing last recording:", lastRecordingPath);
    } catch (error) {
      console.error("Failed to play recording:", error);
      Alert.alert("Playback Error", "Failed to play recording. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          { backgroundColor: recorderState.isRecording ? '#22c55e' : '#ff4444' }
        ]}
        onPress={handleRecord}
      >
        <Text style={styles.recordText}>
          {recorderState.isRecording ? 'Recording...' : 'Record'}
        </Text>
      </TouchableOpacity>

      <Pressable
        style={styles.playButton}
        onPress={playLastRecording}
        disabled={!lastRecordingPath}
      >
        <Text style={[
          styles.playText,
          { opacity: !lastRecordingPath ? 0.5 : 1 }
        ]}>
          {playerState.isLoaded && playerState.playing ? 'Playing...' : 'Play Last Recording'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  recordButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  recordText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playButton: {
    position: 'absolute',
    bottom: 80,
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  playText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;