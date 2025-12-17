import { Pressable, StyleSheet, Text, View } from 'react-native';


import FamilyManagementCard from '@/components/familyManagement';
import { useLiveStore } from '@/store/live';

export default function App() {
  const { getCurrentLocation, location, isTracking, error, triggerSOS, clearSOS, sosActive, } = useLiveStore();

  return (
    <View style={styles.container}>
      <Pressable onPress={getCurrentLocation}>
        <Text>Send My Location</Text>
      </Pressable>
      {location && <Text>{location.lat}, {location.lng}</Text>}
      {error && <Text>{error}</Text>}


      <Pressable onPress={triggerSOS}>
  <Text>Trigger SOS</Text>
</Pressable>

<Pressable onPress={clearSOS}>
  <Text>Clear SOS</Text>
</Pressable>

{sosActive && <Text>SOS ACTIVE</Text>}
{error && <Text>{error}</Text>}
      <FamilyManagementCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
  },
});
