import Colors from "@/app/Constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

import { supabase } from "../lib/supabase";

import { Link } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const colorScheme = useColorScheme() ?? "light";
  const color = Colors[colorScheme === "dark" ? "dark" : "light"]; // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";
  // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login failed", error.message);
      return;
    }

    Alert.alert("Success", "You are now logged in!");
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: color.text }]}>iMD</Text>
      <>
        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, { color: color.text, borderColor: color.text }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button title="Log In" onPress={signIn} />

        <Text style={[styles.loginText, { color: color.text }]}>
          Don't have an account?
        </Text>

        <Link
          href="/signup"
          style={[
            styles.link,
            {
              color: color.tint,
            },
          ]}
        >
          Sign up here
        </Link>
      </>
    </View>
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
