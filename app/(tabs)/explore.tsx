import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TabTwoScreen() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.imageContainer, { marginBottom: 30 }]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.image}
          />
        </View>

        <Text style={[styles.cardTitle, { textAlign: "center" }]}>
          Welcome to iMD
        </Text>

        <Text style={[styles.cardText, { textAlign: "center" }]}>
          Now that You're logged in, you should make an appointment {"\n"} So
          you should navigate to the Appointments tab
        </Text>

        <Text style={[styles.cardText, { textAlign: "center" }]}>
          Once you've made your appointment, you can navigate to the Recording
          tab, select your appointment, and record a recording for that
          appointment
        </Text>

        <Text style={[styles.cardText, { textAlign: "center" }]}>
          After Recording, you can upload it to the storage bucket, and then you
          can view your recording's transcription
        </Text>

        <Text style={[styles.cardText, { textAlign: "center" }]}>
          From their, you can Hit "Explain My Visit", and an AI Summary will pop
          up.
        </Text>

        <Text style={[styles.cardText, { textAlign: "center" }]}>
          To add a caregiver to share your appointment with, Go to your Profile,
          and hit "Manage Caregiver Relationships". From their, you can invite a
          caregiver by generating an invite token, and copying it to them
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },

  container: {
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    padding: 20,
  },

  imageContainer: {
    flex: 1, // Forces container to fill the full screen height
    justifyContent: "center", // Centers content vertically
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10, // Optional: rounded corners
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 0,
    marginLeft: 0,
    //width: "80%",
  },

  cardText: {
    fontSize: 16,
    marginLeft: 0,
    marginBottom: 14,
    fontWeight: "semibold",
    // color: "#393939",
    // maxWidth: "80%",
    //width: "80%",
  },
});
