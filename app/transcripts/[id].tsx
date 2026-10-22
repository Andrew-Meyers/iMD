import Colors from "@/app/Constants/Colors";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TranscriptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vars for the Explanations
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const color = Colors[colorScheme === "dark" ? "dark" : "light"];
  const { user } = useAuth();
  // I think these functions are not very good, as Chat seems Loopy right now. Will have to be redone

  useEffect(() => {
    async function loadTranscript() {
      if (!id) {
        setError("No transcript ID was provided.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("transcriptions")
        .select("raw_text")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Failed to load transcript:", error);
        setError("Unable to load this transcript.");
      } else {
        setTranscript(data.raw_text);
      }

      setLoading(false);
    }

    loadTranscript();
  }, [id]);

  async function explainTranscript() {
    if (!id) {
      setExplanationError("No user ID was provided.");
      return;
    }

    setIsExplaining(true);
    setExplanationError(null);
    setExplanation(null);

    const { data, error } = await supabase
      .from("transcriptions")
      .select("simplified_explanation")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error Checking the transcription: ", error.message);
      return;
    }

    if (data.simplified_explanation === "" || !data.simplified_explanation) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "explain-transcript",
          {
            body: {
              transcription_id: id,
            },
          },
        );

        if (error) {
          console.error("Explanation Request Failed:", error.message);

          try {
            const response = (error as any).context;

            if (response?.clone) {
              const errorDetails = await response.clone().text();
              console.error("Edge Function response details:", errorDetails);
            } else {
              console.error("Edge Function error context:", response);
            }
          } catch (debugError) {
            console.error("Could not read error details:", debugError);
          }

          setExplanationError(
            "We couldn't get an explanation. Please try again.",
          );
          return;
        }

        if (!data?.success || typeof data.explanation !== "string") {
          setExplanationError(
            data?.error || "The AI returned an unexpected response",
          );
          return;
        }

        setExplanation(data.explanation);
        updateTranscription(data.explanation);
      } catch {
        console.error("Unexpected Explanation Error: ", error);
        setExplanationError(
          "Something went wrong. Please Check your connection and try again",
        );
      } finally {
        setIsExplaining(false);
      }
    } else {
      Alert.alert(
        "This Transcription already has an explanation. Loading that now.",
      );
      setExplanation(data.simplified_explanation);
      setIsExplaining(false);
    }
  }

  async function updateTranscription(explanation: string) {
    const { data, error } = await supabase
      .from("transcriptions")
      .update({ simplified_explanation: explanation })
      .eq("id", id)
      .select();

    if (error) {
      Alert.alert("Error", "Error updating Recording status: " + error.message);
      return;
    }

    console.log("Transcription Explanation  updated: ", data);

    console.log("Transcription Explanation JSON: ", JSON.stringify(data));
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {/*<Stack.Screen
        options={{
          title: "Transcript",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={15}
              style={{ paddingLeft: 12 }}
            >
              <Text style={{ fontSize: 17, color: "#007AFF" }}>← Back</Text>
            </Pressable>
          ),
        }}
      />*/}

      <Stack.Screen options={{ title: "Transcript" }} />

      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 16,
          color: color.text,
        }}
      >
        Appointment Transcript
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text>{error}</Text>
      ) : (
        <View>
          <ScrollView>
            <Text style={{ fontSize: 16, lineHeight: 25, color: color.text }}>
              {transcript || "No transcript text was saved."}
            </Text>
          </ScrollView>

          <Pressable
            onPress={() => {
              explainTranscript();
            }}
            disabled={isExplaining || !transcript}
            style={{
              backgroundColor:
                isExplaining || !transcript ? "#8A8A8A" : "#0D9488",
              padding: 14,
              borderRadius: 10,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              {isExplaining ? "Explaining Your Visit..." : "Explain My Visit"}
            </Text>
          </Pressable>

          {isExplaining && (
            <ActivityIndicator size="large" style={{ marginTop: 16 }} />
          )}

          {explanationError && (
            <Text style={{ color: "red", marginTop: 16 }}>
              {explanationError}
            </Text>
          )}

          {explanation && (
            <View style={{ marginTop: 24, marginBottom: 30 }}>
              <Text
                style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}
              >
                Your Visit Explained
              </Text>

              <Text style={{ fontSize: 16, lineHeight: 25 }}>
                {explanation}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {},

  explainApptBtn: {},
});
