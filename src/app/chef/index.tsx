import React from 'react';
import { StatusBar } from 'react-native';
import { ChefOrders } from '../../features/chef/components/ChefOrders';

export default function ChefScreen() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <ChefOrders />
    </>
  );
}