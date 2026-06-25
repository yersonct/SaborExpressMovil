import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';

export const TablesGridView = ({ tables, handleTablePress }: any) => (
  <FlatList
    data={tables}
    keyExtractor={item => item.id}
    numColumns={2}
    contentContainerStyle={styles.content}
    columnWrapperStyle={{ justifyContent: 'space-between' }}
    showsVerticalScrollIndicator={false}
    ListHeaderComponent={<Text style={styles.instructionsText}>Toca una mesa libre para tomar el pedido.</Text>}
    renderItem={({ item }) => {
      const isOccupied = item.status === 'Ocupada';
      let iconName = 'restaurant-outline';
      if (item.type === 'outdoor') iconName = 'partly-sunny-outline';
      if (item.type === 'bar') iconName = 'wine-outline';
      if (item.type === 'vip') iconName = 'star-outline';

      return (
        <TouchableOpacity
          style={[styles.tableGridCard, isOccupied && styles.tableGridCardOccupied]}
          onPress={() => handleTablePress(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, isOccupied ? { backgroundColor: '#EF4444' } : { backgroundColor: '#10B981' }]} />
          <Ionicons name={iconName as any} size={40} color={isOccupied ? '#991B1B' : '#1E293B'} style={{ marginBottom: 10 }} />
          <Text style={[styles.gridTableName, isOccupied && { color: '#991B1B' }]}>{item.name}</Text>

          <View style={styles.capacityBadge}>
            <Ionicons name="people" size={14} color="#64748B" />
            <Text style={styles.capacityText}>{item.capacity} personas</Text>
          </View>
          <Text style={[styles.gridTableStatus, isOccupied ? { color: '#EF4444' } : { color: '#10B981' }]}>
            {item.status}
          </Text>
        </TouchableOpacity>
      )
    }}
  />
);