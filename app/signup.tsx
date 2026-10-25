import Colors from "@/app/Constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

import { Link, router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateofBirth] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  const colorScheme = useColorScheme() ?? "light";
  const color = Colors[colorScheme === "dark" ? "dark" : "light"]; // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";
  // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  async function signUp() {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing Information", "Please Complete All Fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Error",
        "Please check to make sure the Passwords are the same",
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password Error",
        "Passwords are required to have more than 6 characters",
      );
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          dateOfBirth: dateOfBirth,
        },
      },
    });

    console.log("ACCOUNT SIGN UP DATA:" + data.session);
    console.log("SIGN UP ERROR: " + error?.message);

    if (error) {
      Alert.alert("SUPABASE SIGN UP ERROR", error.message);
      return;
    }

    setIsLoading(false);

    /*
     * Depending on your Supabase email-confirmation settings,
     * data.session may be null until the user confirms their email.
     */
    if (!data.session) {
      Alert.alert(
        "Check Your Email",
        "Your account was created. Please confirm your email before logging in.",
      );

      router.replace("/login");
      return;
    }

    Alert.alert("Success", "Your account was created!");

    addProfileToUserRoles(
      isEnabled ? "patient" : "caregiver",
      data.session.user.id,
    );

    router.replace("/(tabs)");
  }

  async function addProfileToUserRoles(role: string, userId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: role })
      .select()
      .single();

    if (error) {
      console.error(
        "There was an error when creating your Account Role: ",
        error,
      );
      return;
    }
  }

  return (
    <ScrollView style={[]}>
      <View style={[styles.container, { backgroundColor: color.background }]}>
        <Text style={[styles.title, { color: color.text, marginTop: 100 }]}>
          iMD
        </Text>

        <Text style={[styles.header2, { color: color.text }]}></Text>

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Date Of Birth: (YYYY/MM/DD)"
          value={dateOfBirth}
          onChangeText={setDateofBirth}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />

        <View
          style={[
            styles.container,
            { flexDirection: "column", alignItems: "center" },
          ]}
        >
          <Text style={{ marginBottom: 12 }}>
            You are a {isEnabled ? "Caregiver" : "Patient"}
          </Text>
          <View style={styles.switchContainer}>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
        </View>

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <Button
          title={isLoading ? "Creating Account" : "Sign Up"}
          onPress={signUp}
          disabled={isLoading}
        />

        <Text style={[styles.loginText, { color: color.text }]}>
          Already have an account?
        </Text>

        <Link
          href="/login"
          style={[
            styles.link,
            {
              color: color.tint,
            },
          ]}
        >
          Log in here
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 30,
  },

  switchContainer: {
    flex: 1, // Forces container to fill the full screen height
    justifyContent: "center", // Centers content vertically
    alignItems: "center",
  },

  header2: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  success: {
    fontSize: 20,
    marginBottom: 20,
  },

  button: {
    marginTop: 20,
    borderRadius: 8,
    borderColor: "#007AFF",
    borderWidth: 1,
    padding: 12,
    elevation: 2,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent dim background
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Shadow for Android
  },

  buttonOpen: {
    backgroundColor: "#007AFF",
  },
  buttonClose: {
    backgroundColor: "#FF3B30",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
  },

  loginText: {
    marginTop: 25,
    marginBottom: 8,
  },

  link: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
