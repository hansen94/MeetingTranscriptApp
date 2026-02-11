import { Platform } from "react-native";


const BASEURL = Platform.OS === 'android' ? process.env.EXPO_PUBLIC_ANDROID_LOCAL_API_URL : process.env.EXPO_PUBLIC_IOS_LOCAL_API_URL;

const defaultErrorHandler = (error) => {
  console.error(error);
}

const getJSONContent = async (response) => {
  const errorCodes = [
    400,
    401,
    402,
    403,
    404,
    405,
    409,
    412,
    415,
    500,
  ];
  if (!errorCodes.includes(response.status)) {
    let data: any;
    await response.text().then(text => {
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = text;
      }
    });

    return data !== undefined && data !== '' ? data : response;
  }
}

export const uploadRecording = async (fileUri: string, filename: string) => {
  const uri = `${BASEURL}/recordings/upload`;
  
  // Create form data
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'video/mp4'
  } as any);
  
  const request = {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  };
  
  try {
    const response = await fetch(uri, request);
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Backend returns {recording_id, status, message, storage_path}
    return {
      recording_id: data.recording_id,
      status: data.status,
      message: data.message,
      storage_path: data.storage_path
    };
  } catch (error) {
    defaultErrorHandler(error);
    throw error;
  }
}

export const getRecordings = async () => {
  const uri = `${BASEURL}/recordings`;
  console.log(uri);
  // const uri = 'https://www.google.com';
  const request = {
    method: 'GET',
  }
  const response = await fetch(uri, request).catch(defaultErrorHandler);
  const respJson = await getJSONContent(response);

  return respJson;

}