import React from 'react';
import { StatusBar } from 'react-native';
import ClientDashboard from '../../features/Client/components/ClientDashboard';

export default function ClientScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <ClientDashboard />
    </>
  );
}