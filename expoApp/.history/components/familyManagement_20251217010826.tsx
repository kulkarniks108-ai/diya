import COLORS from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function FamilyManagementCard() {
  const [email, setEmail] = useState<string>("");

  const { familyMembers, addFamilyMemberByEmail, removeFamilyMember, listenToFamilyMembers, isLoading, error } = useAuthStore();

  useEffect(() => {
    const unsubscribe = listenToFamilyMembers();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [listenToFamilyMembers]);

  const handleAdd = async () => {
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) return; // basic validation
    await addFamilyMemberByEmail(trimmed);
    setEmail("");
  };

  const renderItem = ({ item }: { item: { uid: string; email: string } }) => (
    <View style={styles.memberRow}>
      <Text style={styles.memberEmail}>{item.email}</Text>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeFamilyMember(item.uid)}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="px-5" style={styles.card}>
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

