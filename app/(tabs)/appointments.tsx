import Colors from "@/app/Constants/Colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import DateTimePicker from "@react-native-community/datetimepicker";

import { supabase } from "../../lib/supabase";

import { useAuth } from "@/contexts/AuthContext";

export default function AppointmentsScreen() {
  // Variables used for Viewing Appointments
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isApptViewed, setIsApptViewed] = useState(false); // This is a placeholder for the state that tracks whether appointments have been viewed or not.

  type Appointment = {
    id: string;
    user_id: string;
    doctor_name: string;
    specialty: string;
    location: string;
    scheduled_at: string;
    notes: string;
    created_at: string;
    updated_at: string;
  };

  // Color Scheme
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme === "dark" ? "dark" : "light"]; // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  // The Variables and setters needed for making an appointment
  const [isMakingAppt, setIsMakingAppt] = useState(false); // This is a placeholder for the state that tracks whether the user is making an appointment or not.
  const [doctorName, setDoctorName] = useState(""); // This is a placeholder for the state that tracks the doctor's name for the appointment.
  const [doctorSpecialty, setDoctorSpecialty] = useState(""); // This is a placeholder for the state that tracks the doctor's specialty for the appointment.
  const [appointmentLocation, setAppointmentLocation] = useState(""); // This is a placeholder for the state that tracks the location of the appointment.
  const [appointmentDate, setAppointmentDate] = useState(new Date()); // This is a placeholder for the state that tracks the appointment date.
  const [appointmentNotes, setAppointmentNotes] = useState(""); // This is a placeholder for the state that tracks any notes for the appointment.

  const [showDatePicker, setShowDatePicker] = useState(false); // This is a placeholder for the state that tracks whether the date picker is shown or not.
  const [showTimePicker, setShowTimePicker] = useState(false); // This is a placeholder for the state that tracks whether the time picker is shown or not.

  const [transcripts, setTranscripts] = useState<any[]>([]); // This is a placeholder for the state that tracks the transcripts for the appointments.
  const [isCardPressed, setCardPressed] = useState(false); // This is a placeholder for the state that tracks whether the card is pressed or not.
  const [pendingTranscriptionID, setPendingTranscriptionID] = useState<
    string | null
  >(null);

  type CaregiverRelationship = {
    id: string;
    primary_user_id: string;
    caregiver_user_id: string;
    permission: "read" | "write";
    status: "pending" | "active" | "revoked";
    created_at: string;
    updated_at: string;
  };

  const [caregiverRelationship, setCaregiverRelationship] =
    useState<CaregiverRelationship[]>();

  // Account Roles
  const [accountRole, setAccountRole] = useState<{ role: string }[] | null>(
    null,
  );

  const isPatient =
    accountRole?.some((item) => item.role === "patient") ?? false;
  const isCaregiver =
    accountRole?.some((item) => item.role === "caregiver") ?? false;

  // Variables used for the Authentication and Context
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    console.log("Getting Appts 1");
    getAppointments(user.id);
    getAccountRole();
  }, [user]);

  async function getAppointments(userId: string) {
    // This currently fetches our own appointments, now we need to add in fetching the Caregivers appointments too
    const { data: accountAppts, error: accountApptsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", userId);

    if (accountApptsError) {
      Alert.alert("Appointments error", accountApptsError.message);
      return;
    }

    console.log("Your Appointments data:", accountAppts);

    // const rels = getCaregiverRelationship(userId)

    getCaregiverRelationship(userId);

    // Make new func to bypass this?
    /*rels.forEach((rel) => {
      const { data: shared, error: sharedError } = await supabase.from("shared_appointments").select("*").eq("relationship_id", rel.id);
    });*/

    let sharedAppts: typeof accountAppts = [];

    let sharedApptIDs: string[] = [];

    if (caregiverRelationship) {
      await Promise.all(
        caregiverRelationship.map(async (relationship) => {
          const { data: shared, error: sharedError } = await supabase
            .from("shared_appointments")
            .select("*")
            .eq("relationship_id", relationship.id);

          if (sharedError) {
            Alert.alert(
              "Appointments error: Error in retrieving the Shared Appointments:- ",
              sharedError.message,
            );
            return;
          }

          console.log("Shared Appointments: ", shared);

          sharedApptIDs = [
            ...new Set(
              (shared ?? []).map((sharedAppt) => sharedAppt.appointment_id),
            ),
          ];
        }),
      );

      // If we have any shared Appts essentially
      if (sharedApptIDs.length > 0) {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .in("id", sharedApptIDs);

        if (error) {
          console.error("Error fetching shared appointment records:", error);
          return;
        }

        sharedAppts = data ?? [];
      }

      // I think we need to make a new array of individual shared appt ids, then we can use the .in to find all those appt

      // Error because you cannot get a singular Appt id from a list of shared appts -> find a way to turn
      // this into single shared appts
      //const { data: sharedAppts, error: sharedApptsError} = await supabase.from("appointments").select("*").eq("id", shared.appointment_id);
    }

    const combinedAppts = [...(accountAppts ?? []), ...sharedAppts];

    const uniqueAppts = Array.from(
      new Map(
        combinedAppts.map((appointment) => [appointment.id, appointment]),
      ).values(),
    );

    setAppointments(uniqueAppts);

    // Alert.alert("Appointments", "This functionality is not implemented yet.");
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

  async function makeAppointment(userID: string) {
    if (!doctorName.trim()) {
      Alert.alert("Error", "Please enter a doctor's name.");
      return;
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: userID,
        doctor_name: doctorName.trim(),
        specialty: doctorSpecialty.trim() || null,
        location: appointmentLocation.trim() || null,
        scheduled_at: appointmentDate.toISOString(),
        notes: appointmentNotes.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error making appointment:", error);
      Alert.alert("Appointment error", error.message);
      return;
    }

    console.log("Appointment created:", data);

    Alert.alert("Success", "Appointment created successfully!");

    // Reset the form fields
    setDoctorName("");
    setDoctorSpecialty("");
    setAppointmentLocation("");
    setAppointmentNotes("");
    setAppointmentDate(new Date());

    setIsMakingAppt(false);
    getAppointments(userID);
  }

  // How can I use this function to also format the string for the time of appointment for the DB
  function formatAppointmentDate(dateString: string) {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  async function getCaregiverRelationship(userId: string) {
    const { data, error } = await supabase
      .from("caregiver_relationships")
      .select("*")
      .or(`primary_user_id.eq.${userId},caregiver_user_id.eq.${userId}`);

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

  async function deleteAppointments(userId: string, appointmentID: string) {
    getCaregiverRelationship(userId);

    const { data, error } = await supabase
      .from("appointments")
      .select()
      .eq("id", appointmentID)
      .single();

    const { data: sharedAppt, error: sharedApptError } = await supabase
      .from("shared_appointments")
      .select()
      .eq("appointment_id", appointmentID)
      .single();

    if (sharedApptError) {
      console.error("Error in Accessing the Shared Appt: ", sharedApptError);
      return;
    }

    let caregiver;

    if (sharedAppt) {
      const { data: caregiverData, error: caregiverDataError } = await supabase
        .from("caregiver_relationships")
        .select()
        .eq("id", sharedAppt.relationship_id)
        .single();

      if (caregiverDataError) {
        console.error(
          "Error in retrieving the Caregiver Data for Appt Deletion: ",
          sharedApptError,
        );
        return;
      }

      caregiver = caregiverData;
    }

    if (isPatient || caregiver.permission === "write") {
      const { error: deletionError } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appointmentID);

      if (deletionError) {
        console.error("Error deleting appointment: ", deletionError);
        Alert.alert("Appointment deletion error", deletionError.message);
      }
    } else {
      Alert.alert(
        "You cannot delete this appointment because of your permissions status",
      );
      return;
    }

    if (error) {
      console.error("Error in selection for appointment deletion:", error);
      Alert.alert("Appointment selection for deletion error", error.message);
      return;
    }

    getAppointments(userId);
  }

  // This will be used to access the transcripts for the historic appt history part
  async function getAppointmentTranscripts(appointmentID: string) {
    const { data, error } = await supabase
      .from("transcriptions")
      .select("*")
      .eq("appointment_id", appointmentID)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load appointment transcripts:", error);
      return [];
    }

    setTranscripts(data);
    return data;
  }

  function moveToTranscriptionScreen(transcriptionID: string) {
    router.push({
      pathname: "/transcripts/[id]",
      params: { id: transcriptionID },
    });
  }

  function formatDateForInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatTimeForInput(date: Date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${mins}`;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: color.text }]}>
        iMD {"\n"} Scheduler Page
      </Text>

      <View style={{ marginTop: 20 }}>
        <Button
          title="View Appointments"
          onPress={() => {
            if (user) {
              getAppointments(user.id);
            }
            setIsApptViewed(true);
          }}
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Button
          title="Make Appointment"
          onPress={() => {
            if (!user) {
              Alert.alert(
                "Error",
                "You must be logged in to make an appointment.",
              );
              return;
            }

            if (!isPatient) {
              Alert.alert("You must be a Patient to make an Appointment");
              return;
            }

            setIsMakingAppt(true);
          }}
        />
      </View>

      <Modal
        animationType="slide" // Options: 'none', 'slide', 'fade'
        transparent={true} // Makes background overlay transparent
        visible={isApptViewed} // Bound to state
        onRequestClose={() => {
          // Handles Android hardware back button
          setIsApptViewed(!isApptViewed);
        }}
        onDismiss={() => {
          if (pendingTranscriptionID) {
            const id = pendingTranscriptionID;
            setPendingTranscriptionID(null);

            moveToTranscriptionScreen(id);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={{ alignItems: "center" }}
            showsVerticalScrollIndicator={false}
          >
            {appointments.map((appointment, index) => (
              <View
                style={styles.cardStyle}
                key={index}
                onStartShouldSetResponder={() => true}
                onResponderGrant={() => {
                  console.log(
                    "Card pressed for appointment ID:",
                    appointment.id,
                  );
                }}
                onResponderRelease={() => {
                  console.log(
                    "Card released for appointment ID:",
                    appointment.id,
                  );

                  getAppointmentTranscripts(appointment.id);
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
                  key={index}
                >
                  <Text style={styles.cardTitle}>
                    {formatAppointmentDate(appointment.scheduled_at)} with{" "}
                    {appointment.doctor_name.substring(0, 2).toUpperCase() ===
                    "DR"
                      ? appointment.doctor_name
                      : `Dr. ${appointment.doctor_name}`}
                  </Text>
                  {/* Displaying the appointment details */}
                  <Text style={styles.cardText}>
                    Appointment ID: {appointment.id}
                    at {appointment.location}. Notes: {appointment.notes}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.button,
                    styles.buttonClose,
                    styles.buttonDelete,
                  ]}
                  onPress={() => {
                    if (user) {
                      deleteAppointments(user.id, appointment.id);
                    }
                  }}
                >
                  <FontAwesome name="trash" size={18} color="black" />
                </Pressable>

                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={isCardPressed}
                  onRequestClose={() => setCardPressed(false)}
                  onDismiss={() => {
                    if (pendingTranscriptionID) {
                      setIsApptViewed(false);
                    }
                  }}
                >
                  <View style={styles.modalOverlay}>
                    <ScrollView
                      style={styles.modalScrollView}
                      contentContainerStyle={{ alignItems: "center" }}
                      showsVerticalScrollIndicator={false}
                    >
                      {transcripts.map((transcript, index) => (
                        <Pressable
                          style={styles.modalView}
                          key={index}
                          onPress={() => {
                            setPendingTranscriptionID(transcript.id);
                            setCardPressed(false);
                          }}
                        >
                          <Text style={styles.modalTitle}>
                            Transcript for Appointment ID: {transcript.id}
                            Date: {formatAppointmentDate(transcript.created_at)}
                          </Text>
                          <Text style={[styles.modalText]}>
                            {transcript.raw_text ||
                              "No transcription available for this appointment."}
                          </Text>
                        </Pressable>
                      ))}

                      <Pressable
                        style={[
                          styles.button,
                          styles.buttonClose,
                          { marginBottom: 30 },
                        ]}
                        onPress={() => setCardPressed(false)}
                      >
                        <Text style={styles.textStyle}>Close</Text>
                      </Pressable>
                    </ScrollView>
                  </View>
                </Modal>
              </View>
            ))}

            {/* Close Button */}
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsApptViewed(!isApptViewed)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isMakingAppt}
        onRequestClose={() => setIsMakingAppt(!isMakingAppt)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={[styles.modalText]}>Make New Appointment</Text>
            {/* Form fields for making appointment */}
            <TextInput
              style={[styles.input]}
              placeholder="Doctor's Name"
              placeholderTextColor={styles.modalText.color}
              value={doctorName}
              onChangeText={setDoctorName}
            />

            <TextInput
              style={[styles.input]}
              placeholder="Doctor's Specialty"
              placeholderTextColor={styles.modalText.color}
              value={doctorSpecialty}
              onChangeText={setDoctorSpecialty}
            />

            <TextInput
              style={[styles.input]}
              placeholder="Location"
              placeholderTextColor={styles.modalText.color}
              value={appointmentLocation}
              onChangeText={setAppointmentLocation}
            />

            {Platform.OS === "web" ? (
              <View style={styles.webDateContainer}>
                <Text style={[styles.dateLabel, { color: color.text }]}>
                  Appointment Date
                </Text>

                <input
                  type="date"
                  value={formatDateForInput(appointmentDate)}
                  onChange={(event) => {
                    const [year, month, day] = event.target.value
                      .split("-")
                      .map(Number);

                    const newDate = new Date(appointmentDate);

                    newDate.setFullYear(year);
                    newDate.setMonth(month - 1);
                    newDate.setDate(day);

                    setAppointmentDate(newDate);
                  }}
                  style={styles.webInput}
                />
              </View>
            ) : (
              <>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: styles.modalText.color }}>
                    Date:{" "}
                    {appointmentDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={appointmentDate}
                    mode="date"
                    display="default"
                    themeVariant="light"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);

                      if (selectedDate) {
                        setAppointmentDate(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}

            {Platform.OS === "web" ? (
              <View style={styles.webDateContainer}>
                <Text style={[styles.dateLabel, { color: color.text }]}>
                  Appointment Time
                </Text>

                <input
                  type="time"
                  value={formatTimeForInput(appointmentDate)}
                  onChange={(event) => {
                    const [hours, minutes] = event.target.value
                      .split(":")
                      .map(Number);

                    const newDate = new Date(appointmentDate);

                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);

                    setAppointmentDate(newDate);
                  }}
                  style={styles.webInput}
                />
              </View>
            ) : (
              <>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ color: styles.modalText.color }}>
                    Time:{" "}
                    {appointmentDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </Pressable>

                {showTimePicker && (
                  <DateTimePicker
                    value={appointmentDate}
                    mode="time"
                    display="default"
                    themeVariant="light"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);

                      if (selectedTime) {
                        setAppointmentDate(selectedTime);
                      }
                    }}
                  />
                )}
              </>
            )}

            <TextInput
              style={[styles.input]}
              placeholder="Notes"
              placeholderTextColor={styles.modalText.color}
              value={appointmentNotes}
              onChangeText={setAppointmentNotes}
            />

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => {
                if (user) {
                  makeAppointment(user.id);
                }
              }}
            >
              <Text style={styles.textStyle}>Save Appointment</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsMakingAppt(false)}
            >
              <Text style={styles.textStyle}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Text style={[styles.title, { color: color.text }]}>
        Clicking on the two buttons above allows you to view your appointments
        and make new ones
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
    width: "auto",
  },

  // How we modify the make appointment screen
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
  // how we modify the view appointments screen
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
    color: "#000", // Default color for modal text
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },

  buttonSave: {
    backgroundColor: "#34C759",
  },

  dateButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#565656",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },

  webDateContainer: {
    width: "100%",
    marginBottom: 12,
  },

  dateLabel: {
    fontSize: 14,
    marginBottom: 6,
  },

  webInput: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#383838",
    borderRadius: 8,
    fontSize: 16,
    boxSizing: "border-box",
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

  buttonDelete: {
    height: 36,
    width: 36,
    marginTop: 0,
    padding: 0,
    paddingTop: 8,
    paddingLeft: 10,
  },
});

// For submissions --> AI Integration and how it didn't really complete code
// Why Expo and Supabase? --> and how you used different languages
// Why are we choosing the Transcription and Explanation services --> Deepgram for recognizing medical words and
// having the proper pickup on that
// Doing Server Edge Functions was probably the hardest thing for me to understand (had to do 2 of them)

// Adding in the contacts stuff was especially hard on such short notice,
//      and it was dealing with a lot of new parts of the Supabase DB (new table parameters)
// Edit Video with iMovie and upload to Vimeo

// Error in Retrieving caregiver relationships fix for patients
// The Logos are from Loveable - cite that
