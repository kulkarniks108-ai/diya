import { useBleStore } from "@/store/ble";
import { useEffect } from "react";
import { Button, ScrollView, Text, View } from "react-native";

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
          <Text>
            Device: {connection.device?.name ?? "(no name)"} ({connection.device?.id ?? "(unknown id)"})
          </Text>
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
        <Text style={{ fontWeight: "600" }}>Discovered Devices:</Text>
        {devices.map((d) => (
          <View key={d.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text>
              {d.name || "Unknown"} ({d.id})
            </Text>
            <Button title="Connect" onPress={() => void connect(d.id)} />
          </View>
        ))}
        {devices.length === 0 ? <Text style={{ fontStyle: "italic" }}>No devices found yet.</Text> : null}
      </View>

      <View style={{ gap: 6, marginTop: 12 }}>
        <Text style={{ fontWeight: "600" }}>Last Event:</Text>
        <Text>Type: {lastEvent?.type ?? "None"}</Text>
        <Text>Data: {JSON.stringify(lastEvent?.data ?? {})}</Text>
        <Text>Raw Hex: {lastEventRawHex ?? "None"}</Text>
      </View>
    </ScrollView>
  );
}
