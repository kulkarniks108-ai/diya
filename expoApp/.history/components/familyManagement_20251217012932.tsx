import COLORS from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type FamilyMember = { uid: string; email: string };

export default function FamilyManagementCard() {
  const [email, setEmail] = useState<string>("");

  // Select only the state needed to render. Avoid selecting actions here to keep referential stability.
  const familyMembers = useAuthStore((s) => s.familyMembers);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  // Access actions via getState() inside callbacks to avoid identity churn in dependencies.
  const addMember = useCallback(async (value: string) => {
    await useAuthStore.getState().addFamilyMemberByEmail(value);
  }, []);

  const removeMember = useCallback(async (uid: string) => {
    await useAuthStore.getState().removeFamilyMember(uid);
  }, []);

  // Start the listener exactly once on mount; guard against repeated mounts.
  const startedRef = useRef<boolean>(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // Call via getState() so we don't depend on a possibly changing function reference.
    useAuthStore.getState().listenToFamilyMembers();
    // No cleanup: the store owns the listener lifecycle per current API (returns void).
  }, []);

  const handleAdd = useCallback(async () => {
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) return;
    await addMember(trimmed);
    setEmail("");
  }, [email, addMember]);

  const renderItem = useCallback(
    ({ item }: { item: FamilyMember }) => (
      <View style={styles.memberRow}>
        <Text style={styles.memberEmail}>{item.email}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={() => removeMember(item.uid)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    ),
    [removeMember]
  );

  return (
    <View style={[styles.card, styles.cardPadding]}>
      <Text style={styles.title}>Family Access</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Family member email</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="family@example.com"
            placeholderTextColor={COLORS.placeholderText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.addButtonText}>Add Family Member</Text>
        )}
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={familyMembers}
        keyExtractor={(m) => m.uid}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No family members added yet.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingTop: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  cardPadding: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    color: COLORS.textDark,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: COLORS.inputBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 8,
  },
  memberEmail: {
    color: COLORS.textDark,
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
});