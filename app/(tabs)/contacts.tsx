import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";


export default function AppointmentsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const color = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [guardianEmail, setGuardianEmail] = useState("");

  // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: color.text }]}>
        iMD {"\n"} Contacts Page
      </Text>

      <Text style={[styles.title, { color: color.text }]}>
        This Page is a work in progress. {"\n"} Please check back later for
        updates.
      </Text>
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
});
