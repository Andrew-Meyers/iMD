import { supabase } from "@/lib/supabase";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Custom Icons Imports
import Colors from "@/app/Constants/Colors";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  const Color = Colors[colorScheme === "dark" ? "dark" : "light"]; // The Usual way to do have color theme: const textColor = colorScheme === "dark" ? "#fff" : "#000";

  const [roles, setRoles] = useState<{ role: string }[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("Error loading session: ", error.message);
        return;
      }

      setUserId(data.session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setRoles(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRoles() {
      if (!userId) {
        setRoles([]);
        return;
      }

      const { data, error } = await supabase.rpc("get_my_roles");

      if (!active) return;

      if (error) {
        console.error("Error Loading User's Roles: ", error.message);
        setRoles([]);
        return;
      }

      setRoles(data ?? []);
    }

    loadRoles();

    return () => {
      active = false;
    };
  }, [userId]);

  const isPatient = roles?.some((item) => item.role === "patient") ?? false;
  const isCaregiver = roles?.some((item) => item.role === "caregiver") ?? false;

  // Need to test to figure out for newly created accounts if this system still works
  if (roles === null) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Color.tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="newspaper-outline"
              size={28}
              color={focused ? Color.tabIconSelected : Color.tabIconDefault}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          href: isPatient ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <Feather
              name="share"
              size={28}
              color={focused ? Color.tabIconSelected : Color.tabIconDefault}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: "Record",
          href: isPatient ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <FontAwesome
              name="microphone"
              size={28}
              color={focused ? Color.tabIconSelected : Color.tabIconDefault}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: "Scheduler",
          tabBarIcon: ({ focused }) => (
            <Entypo
              name="calendar"
              size={28}
              color={focused ? Color.tabIconSelected : Color.tabIconDefault}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name="house.fill"
              size={28}
              color={focused ? Color.tabIconSelected : Color.tabIconDefault}
            />
          ),
        }}
      />
    </Tabs>
  );
}
