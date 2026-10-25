import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  Alert,
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";

import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import AntDesign from "@expo/vector-icons/AntDesign";

import { Dropdown } from "react-native-element-dropdown";

import { useAuth } from "@/contexts/AuthContext";

// This page is for sharing specific appts, managing overall relationships is for the profile page
export default function AppointmentsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const color = Colors[colorScheme === "dark" ? "dark" : "light"];

  type CaregiverRelationship = {
    id: string;
    primary_user_id: string;
    caregiver_user_id: string;
    permission: "read" | "write";
    status: "pending" | "active" | "revoked";
    created_at: string;
    updated_at: string;
  };

  type OtherUserProfile = {
    id: string;
    first_name: string;
    last_name: string;
  };

  type RelationshipWithProfile = {
    relationship: CaregiverRelationship;
    profile: OtherUserProfile | null;
  };

  // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);

  const [isApptShared, setIsApptShared] = useState(false);
  const [relationshipOfSharedAppt, setRelationshipOfSharedAppt] = useState<
    string | null
  >(null);
  const [caregiverRelationship, setCaregiverRelationship] = useState<
    CaregiverRelationship[]
  >([]);
  const [relationshipsWithProfile, setRelationshipsWithProfile] = useState<
    RelationshipWithProfile[]
  >([]);
  const [accountRole, setAccountRole] = useState<{ role: string }[] | null>(
    null,
  );

  const [isViewingAccess, setIsViewingAccess] = useState(false);
  const [cardPressed, setCardPressed] = useState(false);

  const { user } = useAuth();

  const isPatient =
    accountRole?.some((item) => item.role === "patient") ?? false;
  const isCaregiver =
    accountRole?.some((item) => item.role === "caregiver") ?? false;

  useEffect(() => {
    if (!user) return;

    getAppointments(user.id);
    getAccountRole();
    getCaregiverRelationship(user.id);
  }, [user]);

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label, isFocus && { color: "#007AFF" }]}>
          Select Appointment
        </Text>
      );
    }
    return null;
  };

  // The simple getAppts function since we only want to render the appts we are patient for

  async function getAppointments(userId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      Alert.alert("Appointments error", error.message);
      return;
    }

    console.log("Appointments data:", data);

    setAppointments(data);
  }

  async function isApptSharedFunc(appointmentId: string) {
    const { data, error } = await supabase
      .from("shared_appointments")
      .select()
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (error) {
      console.error("Error in Checking if Appointment is Shared: ", error);
      return;
    }

    if (data) {
      setIsApptShared(true);
      setRelationshipOfSharedAppt(data.relationship_id);
    } else {
      setIsApptShared(false);
      setRelationshipOfSharedAppt(null);
    }
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

  function formatAppointmentDate(dateString: string) {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: color.text }]}>
        iMD Contacts Page
      </Text>

      {renderLabel()}

      {/*This is only for patients, so it should render all appts and then decide whether or not we share them -> How we link the shared appts table to our app; Selecting an appt that is already shared lets you know who its shared with and allows you to change that
      //TODO: Need to update Appts so that appts are only visible with valid relationship, but read v. write doesn't really matter right now -> Maybe make writing able to make appts/share appts*/}

      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: "#007AFF" }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={appointments.map((appointment, index) => ({
          label: formatAppointmentDate(appointment.scheduled_at),
          value: appointment.id,
          index: index,
          ...appointment,
        }))}
        search // Enables the search filter inside the list
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={!isFocus ? "Choose an item" : "..."}
        searchPlaceholder="Search..."
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          setValue(item.value);
          setIsFocus(false);
          // Search for ApptId in Shared Appts
        }}
        renderLeftIcon={() => (
          <AntDesign
            style={styles.icon}
            color={isFocus ? "#007AFF" : "black"}
            name="safety"
            size={20}
          />
        )}
      />

      {/* Value is your appt id */}

      {value && (
        <View>
          {isApptShared && (
            // We will change what pops up when you click on an already shared appt, most likely just who its shared with (name), and such

            <Text
              style={[
                styles.textStyle,
                { color: color.text, marginBottom: 12 },
              ]}
            >
              {relationshipOfSharedAppt}
            </Text>
          )}

          <Text
            style={[styles.textStyle, { color: color.text, marginBottom: 12 }]}
          >
            {isApptShared
              ? relationshipOfSharedAppt
              : "This Appointment is not Shared"}
          </Text>

          <Button
            title="Manage Access to Appointment"
            onPress={() => {
              setIsViewingAccess(true);
              if (!user) return;
              getCaregiverRelationship(user.id);
            }}
          ></Button>

          <Modal
            animationType="slide"
            transparent={true} // Makes background overlay transparent
            visible={isViewingAccess} // Bound to state
            onRequestClose={() => {
              // Handles Android hardware back button
              setIsViewingAccess(!isViewingAccess);
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
                        Manage Relationship with{" "}
                        {relationship.profile?.first_name}{" "}
                        {relationship.profile?.last_name}
                      </Text>
                      {/* Displaying the appointment details */}
                      <Text style={styles.cardText}>
                        Relationship ID: {relationship.relationship.id}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Modal>
        </View>
      )}

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

  dropdown: {
    height: 50,
    width: "50%",
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    zIndex: 999,
    paddingHorizontal: 8,
    backgroundColor: "white",
    fontSize: 14,
    borderRadius: 10,
    marginBottom: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "gray",
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
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
