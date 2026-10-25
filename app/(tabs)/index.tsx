import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect, useState } from "react";
import { Alert, Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/theme";

import { File } from "expo-file-system";

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { Dropdown } from "react-native-element-dropdown";

import { useAuth } from "@/contexts/AuthContext";

import { supabase } from "@/lib/supabase";

import AntDesign from "@expo/vector-icons/AntDesign";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const colorScheme = useColorScheme() ?? "light";
  const color = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingState, setRecordingState] = useState(""); // Can be
  const [currentTranscriptionID, setCurrentTranscriptionID] = useState("");
  // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000;

  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  // Recording Stuff
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const audioPlayer = useAudioPlayer(recordingURI);

  const record = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setRecordingState("recording");
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log("AUDIO RECORDER URI: " + uri);

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      if (uri) {
        setRecordingURI(uri);
      }

      setRecordingState("stopped");
    } catch (error) {
      console.error("Failed to Stop Recording: ", error);
    }
  };

  const playRecording = async () => {
    console.log("Audio URI:", recordingURI);
    console.log("Player:", audioPlayer);
    console.log("Player status:", audioPlayer.currentStatus);
    console.log("Player playing:", audioPlayer.playing);
    console.log("Player duration:", audioPlayer.duration);

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      audioPlayer.play();

      console.log("Play command sent");
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    console.log("Getting Appts 2");
    getAppointments(user.id);
  }, [user]);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permission to access microphone was denied");
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

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

    // Alert.alert("Appointments", "This functionality is not implemented yet.");
  }

  async function uploadAppointmentRecordingToBucket(
    userID: string,
    appointmentID: string,
  ) {
    if (!recordingURI) {
      Alert.alert("Error", "There is no recording to upload.");
      return;
    }

    try {
      // Should this whole thing be in a try-catch statement?
      setRecordingState("uploading");

      const file = new File(recordingURI);

      console.log("Recording URI:", recordingURI);
      console.log("File exists:", file.exists);
      console.log("File size:", file.size);
      console.log("File name:", file.name);
      console.log("File URI:", file.uri);

      if (!file.exists || !file.size) {
        Alert.alert("Error", "The Recording File does not exist or is empty");
        return;
      }

      const fileName = file.name;
      const storagePath = `${userID}/${appointmentID}/${fileName}`;

      console.log("Uploading To: ", storagePath);
      const { data, error } = await supabase.storage
        .from("Appointment-AudioFiles")
        .upload(storagePath, file, { contentType: "audio/m4a", upsert: false });

      if (error) {
        console.error("Storage Upload Error", error);
        Alert.alert("Upload Error", error.message);
        return;
      }

      console.log("Upload Successful: ", data);

      insertRecordingIntoRow(storagePath, appointmentID, userID);
    } catch (error) {
      console.error("Error reading recording file:", error);
      Alert.alert("Error", "Something went wrong while uploading.");
    }
  }

  async function insertRecordingIntoRow(
    storagePath: string,
    appointmentID: string,
    userID: string,
  ) {
    const { data, error } = await supabase
      .from("recordings")
      .insert({
        appointment_id: appointmentID,
        user_id: userID,
        storage_path: storagePath,
        duration_seconds: Math.round(audioPlayer.duration),
        status: "recorded",
      })
      .select()
      .single();

    updateTranscriptionStatus(data.id, "Recording Uploaded");

    if (error) {
      Alert.alert("Error", "Error in Row Creation: " + error.message);
      return;
    }

    if (data) {
      await transcribeRecording(data.id, userID, appointmentID);
    }
  }

  async function transcribeRecording(
    recordingID: string,
    userID: string,
    appointmentID: string,
  ) {
    try {
      updateTranscriptionStatus(recordingID, "Transcribing");

      const { data, error } = await supabase.functions.invoke(
        "transcribe-recording",
        {
          body: {
            recordingID: recordingID,
          },
        },
      );

      if (error) {
        console.error("Transcribing Function Error: ", error);
        Alert.alert("Transcribing Error: ", error.message);
        return;
      }

      // console.log("Transcription Result: " + data);
      console.log("TRANSCRIPTION RESULT:", JSON.stringify(data, null, 2));
      Alert.alert(
        "Transcription Complete: ",
        data.transcript || "No Transcription Returned",
      );

      updateTranscriptionStatus(recordingID, "Transcription Complete");

      const transcriptionText = data.transcript;

      if (!transcriptionText) {
        Alert.alert(
          "Error",
          "Transcription returned no text. Please check the recording and try again.",
        );
        return;
      }

      insertTranscriptionIntoRow(
        appointmentID,
        transcriptionText,
        userID,
        recordingID,
      );
    } catch (error) {
      console.error("Failed to transcribe recording:", error);
      Alert.alert(
        "Error",
        "Something went wrong while transcribing the recording.",
      );
    }
  }

  async function insertTranscriptionIntoRow(
    appointmentID: string,
    transcriptionText: string,
    userID: string,
    recordingID: string,
  ) {
    const { data, error } = await supabase
      .from("transcriptions")
      .insert({
        appointment_id: appointmentID,
        user_id: userID,
        raw_text: transcriptionText,
        summary: transcriptionText.substring(0, 100), // Example summary
        simplified_explanation: "", // Example simplified explanation
        // recording_id: recordingID,
      })
      .select()
      .single();

    if (error) {
      Alert.alert(
        "Error",
        "Error in Transcription Row Creation: " + error.message,
      );
      return;
    }

    console.log("Transcription Row Inserted: ", data);

    updateTranscriptionStatus(
      recordingID,
      "Transcription available in Database",
    );

    setCurrentTranscriptionID(data.id);

    moveToTranscriptionScreen(data.id);
  }

  async function updateTranscriptionStatus(
    recordingID: string,
    newStatus: string,
  ) {
    const { data, error } = await supabase
      .from("recordings")
      .update({ status: newStatus })
      .eq("id", recordingID)
      .select();

    if (error) {
      Alert.alert("Error", "Error updating Recording status: " + error.message);
      return;
    }

    console.log("Recording status updated: ", data);

    console.log("Recording status JSON: ", JSON.stringify(data));

    setRecordingState(newStatus);
  }

  function moveToTranscriptionScreen(transcriptionID: string) {
    router.push({
      pathname: "/transcripts/[id]",
      params: { id: transcriptionID },
    });
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
      <Text style={[styles.title, { color: color.text, marginBottom: 0 }]}>
        iMD
      </Text>

      <Text style={[styles.title, { color: color.text }]}>
        Recording Screen
      </Text>
      {renderLabel()}
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

      <Pressable
        onPress={() => {
          recorderState.isRecording ? stopRecording() : record();
        }}
        style={[styles.button, styles.recordingButton]}
      >
        <Text style={styles.recordingFont}>
          {recorderState.isRecording ? "Stop Recording" : "Start Recording"}
        </Text>
      </Pressable>

      <Text style={[styles.textStyle, { color: color.text }]}>
        {recorderState.isRecording
          ? `Recording Time: ${audioRecorder.currentTime}`
          : `Current Audio File Duration: ${audioPlayer.duration}` +
            `\n Current Timestamp: ${audioPlayer.currentTime}`}
      </Text>

      <View style={{ marginTop: 15 }}>
        <Button
          title="Upload Recording"
          onPress={() => {
            if (!user) {
              Alert.alert("Error", "You must be logged in.");
              return;
            }

            if (!value) {
              Alert.alert("Error", "Please select an appointment.");
              return;
            }

            uploadAppointmentRecordingToBucket(user.id, value);
          }}
        />
      </View>

      <View style={{ marginTop: 15 }}>
        <Button
          title="Restart Recording"
          onPress={() => {
            audioPlayer.pause();
            audioPlayer.seekTo(0);
          }}
        />
      </View>

      <View style={{ marginTop: 15 }}>
        <Button
          title="View Transcription"
          onPress={() => {
            moveToTranscriptionScreen(currentTranscriptionID);
          }}
        />
      </View>

      <Text style={[styles.textStyle, { color: color.text }]}>
        Recording Status: {recordingState || "Idle"}
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

  recordingButton: {
    borderWidth: 5,
    backgroundColor: "#c94141",
    borderColor: "#c94141",
    marginBottom: 15,
  },

  recordingFont: {
    color: "#d7d6d6",
    fontSize: 16,
    fontWeight: "bold",
  },
});
