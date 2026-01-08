import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import App from './src/App';

export default function MainApp() {
  return (
    <>
      <App />
      <StatusBar style="auto" />
    </>
  );
}


