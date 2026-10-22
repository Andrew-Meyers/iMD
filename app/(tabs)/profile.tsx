import { useColorScheme } from "@/hooks/use-color-scheme";
import { useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";

import { supabase } from "@/lib/supabase";

import { useAuth } from "@/contexts/AuthContext";

import { useEffect } from "react";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [caregiverRelationship, setCaregiverRelationship] = useState<any>(null);
  const [isViewingRelationships, setIsViewingRelationships] = useState(false);
  const [cardPressed, setCardPressed] = useState(false);
  const [otherUserData, setOtherUserData] = useState<any>(null);
  const colorScheme = useColorScheme() ?? "light";
  const color = colorScheme === "dark" ? Colors.dark : Colors.light; // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }
    console.log("Getting Profile 1");
    getProfile(user.id);
    getCaregiverRelationship(user.id);
  }, [user]);

  async function getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Data: " + data);

    if (error) {
      Alert.alert("Profile error", error.message);
      return;
    }

    setProfile(data);
    console.log("Profile Set " + profile);
  }

  async function getCaregiverRelationship(userId: string) {
    const { data, error } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .or(`primary_user_id.eq.${userId},caregiver_user_id.eq.${userId}`)
      .single();

    if (error) {
      Alert.alert(
        "Appointments error: Error in retrieving the caregiver relationships:- ",
        error.message,
      );
      return;
    }

    console.log("Caregiver relationships: ", data);

    setCaregiverRelationship(data);
  }

  async function getOtherUserProfile(otherUserId: String) {
    const { data, error } = await supabase
      .rpc("get_related_profile", { p_other_user_id: otherUserId })
      .maybeSingle();

    if (error) {
      Alert.alert("Error getting other Users Profile: ", error.message);
      return;
    }

    if (!data) {
      Alert.alert(
        "There is no such related profile, or your relationship doesn't permit access.",
      );
      return;
    }

    setOtherUserData(data);
  }

  // Get appointments: - Profile.uid

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: color.text }]}>
        iMD {"\n"} Profile Page
      </Text>

      <Text style={{ color: color.text }}>
        Hello{" "}
        {profile ? `${profile?.first_name} ${profile?.last_name}` : "User"}
      </Text>

      <Button
        title="Manage Caregiver Relationships"
        onPress={() => {
          if (user) {
            getCaregiverRelationship(user.id);
            setIsViewingRelationships(true);

            getOtherUserProfile(
              user.id === caregiverRelationship.primary_user_id
                ? caregiverRelationship.caregiver_user_id
                : caregiverRelationship.primary_user_id,
            );
          }
        }}
      ></Button>

      <Modal
        animationType="slide"
        transparent={true} // Makes background overlay transparent
        visible={isViewingRelationships} // Bound to state
        onRequestClose={() => {
          // Handles Android hardware back button
          setIsViewingRelationships(!isViewingRelationships);
        }}
        onDismiss={() => {}}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={{ alignItems: "center" }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[styles.cardStyle, { marginBottom: 20 }]}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => {
                console.log(
                  "Card pressed for appointment ID:",
                  caregiverRelationship.id,
                );
              }}
              onResponderRelease={() => {
                console.log(
                  "Card released for appointment ID:",
                  caregiverRelationship.id,
                );

                // getAppointmentTranscripts(appointment.id);

                // Below, figure out what do we want to display for each relationship
                setCardPressed(true);
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start",
                }}
              >
                <Text style={styles.cardTitle}>
                  Manage Relationship with {otherUserData?.first_name}{" "}
                  {otherUserData?.last_name}
                </Text>
                {/* Displaying the appointment details */}
                <Text style={styles.cardText}>
                  Relationship ID: {caregiverRelationship?.id}
                </Text>
              </View>

              <Modal
                animationType="slide"
                transparent={true}
                visible={cardPressed}
                onRequestClose={() => setCardPressed(false)}
                onDismiss={() => {}}
              >
                <View style={styles.modalOverlay}>
                  <ScrollView
                    style={styles.modalScrollView}
                    contentContainerStyle={{ alignItems: "center" }}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={[styles.cardTitle, { textAlign: "center" }]}>
                      Managing Caregiver Relationship with{" "}
                      {otherUserData?.first_name}
                    </Text>

                    <Text style={styles.cardText}>
                      Relationship ID: {caregiverRelationship?.id} {"\n"}
                      Status: {caregiverRelationship?.status} {"\n"}
                      Permissions: {caregiverRelationship?.permission}
                    </Text>

                    <Button
                      title="Revoke Relationship?"
                      onPress={() => {}}
                    ></Button>

                    {
                      //user ? ((user.id === caregiverRelationship?.primary_user_id) ?  : ) : null
                    }

                    <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setCardPressed(false)}
                    >
                      <Text style={styles.textStyle}>Close</Text>
                    </Pressable>
                  </ScrollView>
                </View>
              </Modal>
            </View>

            <Button title="Add Another Caregiver" onPress={() => {}}></Button>

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsViewingRelationships(!isViewingRelationships)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Text style={[styles.title, { color: color.text }]}>
        This Page is a work in progress. {"\n"} Please check back later for
        updates.
      </Text>

      <Button
        title="Sign Out"
        onPress={async () => {
          await supabase.auth.signOut();
        }}
      />
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

  cardStyle: {
    width: "100%",
    maxWidth: 600,
    height: 125,
    marginTop: 50,
    minHeight: 5,
    minWidth: 200,
    borderColor: "#b00d0d",
    backgroundColor: "#6862ab",
    borderWidth: 5,
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  cardText: {
    fontSize: 8,
    marginLeft: 0,
    // color: "#393939",
    // maxWidth: "80%",
    //width: "80%",
  },

  cardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 0,
    marginLeft: 0,
    //width: "80%",
  },

  modalScrollView: {
    width: "80%",
    margin: 20,
    marginTop: 100,
    marginBottom: 100,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Shadow for Android
  },
});
