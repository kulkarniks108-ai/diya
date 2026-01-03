import MapLibreGL from "@maplibre/maplibre-react-native";
import { StyleSheet, View } from "react-native";

MapLibreGL.setAccessToken(null); // IMPORTANT: no token needed

export default function FamilyLocationScreen() {
  const blindLocation = {
    latitude: 18.5204,
    longitude: 73.8567, // example (Pune)
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={styles.map} mapStyle="https://demotiles.maplibre.org/style.json">
        <MapLibreGL.Camera
          centerCoordinate={[
            blindLocation.longitude,
            blindLocation.latitude,
          ]}
          zoomLevel={15}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* <MapLibreGL.PointAnnotation
          id="blind-person"
          coordinate={[
            blindLocation.longitude,
            blindLocation.latitude,
          ]}
        /> */}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
