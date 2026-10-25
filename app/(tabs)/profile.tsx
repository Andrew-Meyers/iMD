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
  TextInput,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";

import { supabase } from "@/lib/supabase";

import { useAuth } from "@/contexts/AuthContext";

import { useEffect } from "react";

export default function ProfileScreen() {
  type CaregiverRelationship = {
    id: string;
    primary_user_id: string;
    caregiver_user_id: string;
    permission: "read" | "write";
    status: "pending" | "active" | "revoked";
    created_at: string;
    updated_at: string;
  };

  const [profile, setProfile] = useState<any>(null);
  const [caregiverRelationship, setCaregiverRelationship] = useState<
    CaregiverRelationship[]
  >([]);
  const [isViewingRelationships, setIsViewingRelationships] = useState(false);
  const [cardPressed, setCardPressed] = useState(false);
  const [otherUserData, setOtherUserData] = useState<any>(null);
  const colorScheme = useColorScheme() ?? "light";
  const color = colorScheme === "dark" ? Colors.dark : Colors.light; // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";
  const [accountRole, setAccountRole] = useState<{ role: string }[] | null>(
    null,
  );

  const [caregiverInviteToken, setCaregiverInviteToken] = useState("");

  const [hasRelationships, setHasRelationships] = useState(false);

  const [relationshipsWithProfile, setRelationshipsWithProfile] = useState<
    RelationshipWithProfile[]
  >([]);

  const isPatient =
    accountRole?.some((item) => item.role === "patient") ?? false;
  const isCaregiver =
    accountRole?.some((item) => item.role === "caregiver") ?? false;

  const { user } = useAuth();

  type OtherUserProfile = {
    id: string;
    first_name: string;
    last_name: string;
  };

  type RelationshipWithProfile = {
    relationship: CaregiverRelationship;
    profile: OtherUserProfile | null;
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    console.log("Getting Profile 1");
    getProfile(user.id);
    getCaregiverRelationship(user.id);
    getAccountRole();
    loadRelatedProfiles(caregiverRelationship);
  }, [user]);

  useEffect(() => {
    console.log("Updating Caregiver Relationships");
  }, [caregiverRelationship]);

  useEffect(() => {
    console.log("Updating relationships with Profile");
  }, [relationshipsWithProfile]);

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
    let allRelationships = [];

    if (isPatient) {
      const { data, error } = await supabase
        .from("caregiver_relationships")
        .select("*")
        .eq("primary_user_id", userId)
        .eq("status", "active");

      if (error) {
        Alert.alert(
          "Appointments error: Error in retrieving the caregiver relationships:- ",
          error.message,
        );
        return;
      }

      allRelationships.push(...(data ?? []));
    }

    if (isCaregiver) {
      const { data, error } = await supabase
        .from("caregiver_relationships")
        .select("*")
        .eq("caregiver_user_id", userId)
        .eq("status", "active");

      if (error) {
        Alert.alert(
          "Appointments error: Error in retrieving the caregiver relationships:- ",
          error.message,
        );
        return;
      }

      allRelationships.push(...(data ?? []));
    }

    setCaregiverRelationship(allRelationships);

    loadRelatedProfiles(allRelationships);

    /*
    if (allRelationships) {
      setHasRelationships(true);
    } */
  }

  /*
  async function getOtherUserProfile(otherUserId: string) {
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
  }*/

  //TODO Maybe have this be a return function instead of using the function above this
  async function getOtherUser(
    relationship: CaregiverRelationship,
  ): Promise<OtherUserProfile | null> {
    if (!user) return null;

    const otherUserID =
      user.id === relationship.primary_user_id
        ? relationship.caregiver_user_id
        : relationship.primary_user_id;

    const { data, error } = await supabase
      .rpc("get_related_profile", {
        p_other_user_id: otherUserID,
      })
      .maybeSingle();

    if (error) {
      Alert.alert("Error getting other Users Profile: ", error.message);
      return null;
    }

    if (!data) {
      Alert.alert(
        "There is no such related profile, or your relationship doesn't permit access.",
      );
      return null;
    }

    const profile = data as OtherUserProfile;

    return {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
    };
  }

  async function getAccountRole() {
    const { data, error } = await supabase.rpc("get_my_roles");

    if (error) {
      console.error("Error Loading Account Roles: ", error);
      return;
    } else {
      console.log("Account Role: ", data);
      setAccountRole(data);
      console.log("Account Role Data: ", accountRole);
    }
  }

  async function inviteAnotherCaregiver() {
    const { data, error } = await supabase.rpc("create_caregiver_invitation", {
      p_permission: "read",
    });

    console.log("Invite Token: ", data);
    console.log("Invite Error: ", error);

    Alert.alert(
      "Your Caregiver Invitation Token is this: " +
        data +
        "\nPlease Copy this and send it to your whoever your Caregiver is, But no One Else.",
    );
  }

  async function acceptCaregiverInvite(inviteToken: string) {
    const { data, error } = await supabase.rpc("accept_caregiver_invitation", {
      p_token: inviteToken,
    });

    if (error) {
      console.error("Invitation acceptance failed:", error.message);
      return;
    }

    console.log("Accepted relationship ID:", data);
  }

  async function loadRelatedProfiles(relationships: CaregiverRelationship[]) {
    const results = await Promise.all(
      relationships.map(async (relationship) => {
        const profile = await getOtherUser(relationship);

        return {
          relationship,
          profile,
        };
      }),
    );

    setRelationshipsWithProfile(results);
  }

  async function updateRelationshipPermsissions(
    relationshipId: string,
    permissions: boolean,
  ) {
    const { error } = await supabase
      .from("caregiver_relationships")
      .update({ permission: permissions ? "write" : "read" })
      .eq("id", relationshipId);

    if (error) {
      console.error(
        "There was an Error Updating the Relationship Permissions: ",
        error,
      );
      Alert.alert("There was an Error Updating the Relationship Permissions");
      return;
    }
  }

  async function revokeCaregiverRelationship(relationshipId: string) {
    const { error } = await supabase
      .from("caregiver_relationships")
      .update({ status: "revoked" })
      .eq("id", relationshipId);

    if (error) {
      console.error(
        "There was an Error Updating the Relationship Permissions: ",
        error,
      );
      Alert.alert("There was an Error Updating the Relationship Permissions");
      return;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: color.text }]}>
        iMD Profile Page
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

            /*
            if (hasRelationships) {
              getOtherUserProfile(
                user.id === caregiverRelationship.primary_user_id
                  ? caregiverRelationship.caregiver_user_id
                  : caregiverRelationship.primary_user_id,
              );
            }*/

            getAccountRole();
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
            {relationshipsWithProfile?.map((relationship, index) => (
              <View
                style={[styles.cardStyle, { marginBottom: 20 }]}
                onStartShouldSetResponder={() => true}
                onResponderGrant={() => {
                  console.log(
                    "Card pressed for appointment ID:",
                    relationship.relationship.id,
                  );
                }}
                onResponderRelease={() => {
                  console.log(
                    "Card released for appointment ID:",
                    relationship.relationship.id,
                  );

                  // getAppointmentTranscripts(appointment.id);

                  // Below, figure out what do we want to display for each relationship
                  setCardPressed(true);
                }}
                key={relationship.relationship.id}
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
                    Manage Relationship with {relationship.profile?.first_name}{" "}
                    {relationship.profile?.last_name}
                  </Text>
                  {/* Displaying the appointment details */}
                  <Text style={styles.cardText}>
                    Relationship ID: {relationship.relationship.id}
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
                        {relationship.profile?.first_name} {"\n"}
                        You are the{" "}
                        {isPatient
                          ? "patient"
                          : isCaregiver
                            ? "caregiver"
                            : "user"}{" "}
                        in this relationship
                      </Text>

                      <Text style={styles.cardText}>
                        Relationship ID: {relationship.relationship.id} {"\n"}
                        Status: {relationship.relationship.status} {"\n"}
                        Permissions: {relationship.relationship.permission}
                      </Text>

                      <Button
                        title="Revoke Relationship?"
                        onPress={() => {
                          revokeCaregiverRelationship(
                            relationship.relationship.id,
                          );
                        }}
                      ></Button>

                      {(isPatient ||
                        relationship.relationship.permission === "write") && (
                        <Button
                          title="Change Relationship Permissions?"
                          onPress={() => {
                            updateRelationshipPermsissions(
                              relationship.relationship.id,
                              relationship.relationship.permission === "read"
                                ? true
                                : false,
                            );
                          }}
                        ></Button>
                      )}

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
            ))}

            {isPatient && (
              <Button
                title="Add Another Caregiver"
                onPress={() => {
                  inviteAnotherCaregiver();
                }}
              ></Button>
            )}

            <View>
              <TextInput
                style={styles.input}
                placeholder="ex: 'af0ee41...'"
                placeholderTextColor="#888"
                value={caregiverInviteToken}
                onChangeText={(newValue) => setCaregiverInviteToken(newValue)}
              />

              <Button
                title="Accept Invitation with Token"
                onPress={() => {
                  if (caregiverInviteToken) {
                    acceptCaregiverInvite(caregiverInviteToken);
                  } else {
                    Alert.alert("You have not input a caregiver Invite Token");
                  }
                }}
              ></Button>
            </View>

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsViewingRelationships(!isViewingRelationships)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

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
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
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
    marginVertical: 12,
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
    marginBottom: 14,
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
