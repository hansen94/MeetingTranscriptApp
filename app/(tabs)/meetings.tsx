import { getRecordings } from "@/services/recordingServices";
import { useEffect } from "react";
import { View } from "react-native";

const MeetingsScreen = () => {
  useEffect(() => {
    getRecordings();
  }, []);


  return <View />;
};

export default MeetingsScreen;