import { Platform } from "react-native";


const BASEURL = Platform.OS === 'android' ? process.env.EXPO_PUBLIC_ANDROID_LOCAL_API_URL : process.env.EXPO_PUBLIC_IOS_LOCAL_API_URL;

const defaultErrorHandler = (error) => {
  console.error(error);
}

export const uploadRecording = () => {

}

export const getRecordings = async () => {
  const uri = `${BASEURL}/recordings`;
  console.log(uri);
  // const uri = 'https://www.google.com';
  const request = {
    method: 'GET',
  }
  return fetch(uri, request).catch(defaultErrorHandler);

}