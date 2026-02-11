import { getRecordings } from "@/services/recordingServices";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Meeting {
  id: string;
  created_at: string;
  filename: string;
  file_size: number;
  processed_at: string;
  status: string;
  storage_path: string;
  transcript: string;
  upload_time: string;
}

const MeetingsScreen = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const recordings = await getRecordings();
      console.log({ recordings });
      setMeetings(recordings || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      Alert.alert('Error', 'Failed to fetch meetings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const onRefresh = () => {
    fetchRecordings(true);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const handleMeetingPress = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  };

  const renderMeetingItem = ({ item }: { item: Meeting }) => (
    <TouchableOpacity
      style={styles.meetingItem}
      onPress={() => handleMeetingPress(item.id)}
    >
      <View style={styles.meetingInfo}>
        <Text style={styles.filename}>{item.filename}</Text>
        <Text style={styles.date}>{formatDateTime(item.created_at)}</Text>
        <Text style={styles.status}>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading meetings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.container}>
        <FlatList
          data={meetings}
          renderItem={renderMeetingItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text>No meetings found</Text>
            </View>
          }
          contentContainerStyle={meetings.length === 0 ? styles.centerContainer : undefined}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetingItem: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  meetingInfo: {
    flex: 1,
  },
  filename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#495057',
    textTransform: 'capitalize',
  },
});

export default MeetingsScreen;