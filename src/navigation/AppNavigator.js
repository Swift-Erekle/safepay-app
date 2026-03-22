// src/navigation/AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, ActivityIndicator } from "react-native";
import { C } from "../constants/colors";
import { useAuth } from "../store/useAuth";

// Screens
import LoginScreen      from "../screens/LoginScreen";
import RegisterScreen   from "../screens/RegisterScreen";
import DashboardScreen  from "../screens/DashboardScreen";
import DealScreen       from "../screens/DealScreen";
import WalletScreen     from "../screens/WalletScreen";
import ProfileScreen    from "../screens/ProfileScreen";
import CreateDealScreen from "../screens/CreateDealScreen";

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
    </View>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: C.green, fontSize: 32, fontWeight: "800", fontFamily: "serif", marginBottom: 20 }}>
        SafePay<Text style={{ color: C.text }}>.ge</Text>
      </Text>
      <ActivityIndicator color={C.green} size="large" />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:             false,
        tabBarStyle:             {
          backgroundColor: C.navy,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          80,
          paddingBottom:   12,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   C.green,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle:        { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "გარიგებები", tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} /> }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ title: "საფულე", tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "პროფილი", tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle:      { backgroundColor: C.navy },
          headerTintColor:  C.green,
          headerTitleStyle: { color: C.text, fontWeight: "700" },
          contentStyle:     { backgroundColor: C.bg },
        }}
      >
        {!token ? (
          // Auth screens
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // App screens
          <>
            <Stack.Screen name="Main"       component={MainTabs}         options={{ headerShown: false }} />
            <Stack.Screen name="Deal"       component={DealScreen}       options={{ title: "გარიგება" }} />
            <Stack.Screen name="CreateDeal" component={CreateDealScreen} options={{ title: "ახალი გარიგება" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
