import { useBleStore } from "@/store/ble";
import { useEffect } from "react";
import { Button, Pressable, ScrollView, Text, View } from "react-native";

export default function BleDebugScreen() {
  const {
    connection,
    devices,
    scanning,
    lastEvent,
    lastEventRawHex,
    error,
    autoConnect,
    disconnect,
    startScan,
    stopScan,
    connect,
  } = useBleStore();

  useEffect(() => {
    // Try auto-connect when opening debug screen.
    void autoConnect();
  }, [autoConnect]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>ESP32 BLE Debug</Text>

      <View style={{ gap: 6 }}>
        <Text>State: {connection.state}</Text>
        {connection.state === "connected" ? (
          <Text>Device: {connection.device.name ?? "(no name)"} ({connection.device.id})</Text>
        ) : null}
        {connection.state === "connecting" ? <Text>Connecting to: {connection.target}</Text> : null}
        {connection.state === "error" ? <Text>Error: {connection.message}</Text> : null}
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button title="Auto Connect" onPress={() => void autoConnect()} />
        <Button title="Disconnect" onPress={() => void disconnect()} />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Button title={scanning ? "Stop Scan" : "Scan"} onPress={() => (scanning ? stopScan() : void startScan())} />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: "600" }}>Discovered Devices</Text>
        {devices.length === 0 ? <Text>(none)</Text> : null}
        {devices.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => void connect(d.id)}
            style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" }}
          >
            <Text>{d.name ?? "(no name)"}</Text>
            <Text style={{ color: "#666" }}>{d.id}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 12, gap: 6 }}>
        <Text style={{ fontWeight: "600" }}>Last Event</Text>
        <Text>{lastEvent ? `${lastEvent.type} (seq=${lastEvent.seq})` : "(none)"}</Text>
        <Text>Raw: {lastEventRawHex ?? "(none)"}</Text>
      </View>

      <Text style={{ marginTop: 12, color: "#666" }}>
        Tip: First time, ensure your ESP32 advertises name 2ndEye-01.
      </Text>
    </ScrollView>
  );
}
