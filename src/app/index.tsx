import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { LoginForm } from '../features/auth/components/LoginForm';

export default function IndexScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LoginForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
});