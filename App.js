import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Mitr_400Regular, Mitr_500Medium } from '@expo-google-fonts/mitr';
import { TiltWarp_400Regular } from '@expo-google-fonts/tilt-warp';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import LoginScreen     from './src/screens/LoginScreen';
import HomeScreen      from './src/screens/HomeScreen';
import SetupLiveScreen from './src/screens/SetupLiveScreen';
import WaitingRoom     from './src/screens/WaitingRoom';
import LiveScreen      from './src/screens/LiveScreen';
import EndScreen       from './src/screens/EndScreen';

SplashScreen.preventAutoHideAsync();
const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Mitr_400Regular, Mitr_500Medium, TiltWarp_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
          <Stack.Screen name="Login"     component={LoginScreen} />
          <Stack.Screen name="Home"      component={HomeScreen} />
          <Stack.Screen name="SetupLive" component={SetupLiveScreen} />
          <Stack.Screen name="Waiting"   component={WaitingRoom} />
          <Stack.Screen name="Live"      component={LiveScreen} />
          <Stack.Screen name="End"       component={EndScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
