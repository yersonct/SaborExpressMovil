import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';

export const TablesGridView = ({ tables, handleTablePress }: any) => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();

  return <FlatList
    data={tables}
    keyExtractor={item => item.id}
    numColumns={2}
    contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
    columnWrapperStyle={{ justifyContent: 'space-between' }}
    showsVerticalScrollIndicator={false}
    ListHeaderComponent={<Text style={[styles.instructionsText, { color: colors.mutedText }]}>{t.tablesInstruction || 'Toca una mesa libre para tomar el pedido.'}</Text>}
    renderItem={({ item }) => {
      const isOccupied = item.status === 'Ocupada';
      let iconName = 'restaurant-outline';
      if (item.type === 'outdoor') iconName = 'partly-sunny-outline';
      if (item.type === 'bar') iconName = 'wine-outline';
      if (item.type === 'vip') iconName = 'star-outline';

      return (
        <TouchableOpacity
          style={[styles.tableGridCard, { backgroundColor: colors.card, borderColor: colors.border }, isOccupied && styles.tableGridCardOccupied]}
          onPress={() => handleTablePress(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, isOccupied ? { backgroundColor: colors.danger } : { backgroundColor: colors.success }]} />
          <Ionicons name={iconName as any} size={40} color={isOccupied ? colors.danger : colors.text} style={{ marginBottom: 10 }} />
          <Text style={[styles.gridTableName, { color: colors.text }, isOccupied && { color: colors.danger }]}>{item.name}</Text>

          <View style={styles.capacityBadge}>
            <Ionicons name="people" size={14} color={colors.mutedText} />
            <Text style={[styles.capacityText, { color: colors.mutedText }]}>{item.capacity} {t.tablesCapacitySuffix || 'personas'}</Text>
          </View>
          <Text style={[styles.gridTableStatus, isOccupied ? { color: colors.danger } : { color: colors.success }]}>
            {isOccupied ? (t.tableStatusOccupied || 'Ocupada') : (t.tableStatusFree || 'Libre')}
          </Text>
        </TouchableOpacity>
      )
    }}
  />;
}