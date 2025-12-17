import { auth } from "@/config/firebase";
import COLORS from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Logout() {
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const { logout: clearAuth, user } = useAuthStore();

	const userEmail = useMemo<string | undefined>(() => {
		return auth.currentUser?.email ?? user?.email ?? undefined;
	}, [user]);

	const handleLogout = async () => {
		setIsLoading(true);
		setError(null);
		try {
			if (auth.currentUser) {
				await signOut(auth);
			}
			await clearAuth();
			router.replace("/(auth)");
		} catch (e) {
			const message = e instanceof Error ? e.message : "Failed to log out";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.back();
	};

	return (
		<View className="px-5" style={styles.container}>
			<View style={styles.card}>
				<View style={styles.header}>
					<Image
						source={require("../../assets/images/i.png")}
						style={styles.illustration}
						resizeMode="contain"
					/>
					<Text style={styles.title}>Sign out</Text>
					<Text style={styles.subtitle}>
						{userEmail ? `You are signed in as ${userEmail}.` : "You are currently signed in."}
					</Text>
					<Text style={styles.subtitle}>Are you sure you want to log out?</Text>
				</View>

				{error ? (
					<View style={styles.errorBox}>
						<Text style={styles.errorText}>{error}</Text>
					</View>
				) : null}

				<View style={styles.actions}>
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel="Cancel and go back"
						style={styles.secondaryButton}
						onPress={handleCancel}
						disabled={isLoading}
					>
						<Text style={styles.secondaryText}>Cancel</Text>
					</TouchableOpacity>

					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel="Log out of your account"
						style={styles.primaryButton}
						onPress={handleLogout}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color={COLORS.white} />
						) : (
							<Text style={styles.primaryText}>Log out</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
	},
	card: {
		backgroundColor: COLORS.cardBackground,
		borderRadius: 16,
		padding: 24,
		shadowColor: COLORS.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
		borderWidth: 1,
		borderColor: COLORS.border,
	},
	header: {
		alignItems: "center",
		marginBottom: 16,
	},
	illustration: {
		width: 140,
		height: 140,
		marginBottom: 8,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: COLORS.textPrimary,
		marginTop: 4,
	},
	subtitle: {
		fontSize: 14,
		color: COLORS.textSecondary,
		textAlign: "center",
		marginTop: 4,
	},
	errorBox: {
		backgroundColor: COLORS.inputBackground,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: 12,
		padding: 12,
		marginTop: 8,
	},
	errorText: {
		color: COLORS.textPrimary,
		textAlign: "center",
	},
	actions: {
		flexDirection: "row",
		gap: 12,
		marginTop: 16,
	},
	secondaryButton: {
		flex: 1,
		height: 50,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: COLORS.inputBackground,
		justifyContent: "center",
		alignItems: "center",
	},
	secondaryText: {
		color: COLORS.textPrimary,
		fontWeight: "600",
	},
	primaryButton: {
		flex: 1,
		height: 50,
		borderRadius: 12,
		backgroundColor: COLORS.primary,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: COLORS.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	primaryText: {
		color: COLORS.white,
		fontSize: 16,
		fontWeight: "600",
	},
});

