import {
  DarkTheme,
  DefaultTheme,
  Redirect,
  Stack,
  ThemeProvider,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme.web";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return null;
  }

  // const inTabs = segments[0] === "(tabs)";
  const isPublicPage = segments[0] === "login" || segments[0] === "signup";

  // User is NOT logged in
  if (!user && !isPublicPage) {
    return <Redirect href="/login" />;
  }

  // User IS logged in and is trying to access login
  if (user && isPublicPage) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="transcripts/[id]" options={{ title: "Transcript" }} />

      <Stack.Screen name="login" options={{ headerShown: false }} />

      <Stack.Screen name="signup" options={{ headerShown: false }} />

      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          title: "Modal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
