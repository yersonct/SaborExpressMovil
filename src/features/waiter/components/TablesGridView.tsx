import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './style/WaiterDashboardStyles';
import { useWaiterTheme } from '@/features/waiter/context/WaiterThemeContext';
import { useWaiterLanguage } from '@/features/waiter/context/WaiterLanguageContext';
import type { OccupiedTableWaiter } from '@/features/orders/types/order.types';

type WaiterTable = {
  id: string;
  name: string;
  status: string;
  type?: string;
};

type TablesGridViewProps = {
  tables: WaiterTable[];
  handleTablePress: (table: WaiterTable) => void;
  occupiedTableWaiters?: OccupiedTableWaiter[];
};

export const TablesGridView = ({
  tables,
  handleTablePress,
  occupiedTableWaiters = [],
}: TablesGridViewProps) => {
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();

  return <FlatList
    data={tables}
    keyExtractor={item => item.id}
    numColumns={2}
    style={{ flex: 1 }}
    contentContainerStyle={{ padding: 16, paddingBottom: 100, backgroundColor: colors.background }}
    columnWrapperStyle={{ justifyContent: 'space-between' }}
    showsVerticalScrollIndicator={false}
    ListHeaderComponent={<Text style={[styles.instructionsText, { color: colors.mutedText }]}>{t.tablesInstruction || 'Toca una mesa libre para tomar el pedido.'}</Text>}
    renderItem={({ item }) => {
      const isOccupied = item.status === 'Ocupada';
      const assignedWaiterName = isOccupied
        ? occupiedTableWaiters
            .find((assignment) => String(assignment.tableId) === String(item.id))
            ?.employeeName?.trim()
        : undefined;
      let iconName = 'restaurant-outline';
      if (item.type === 'outdoor') iconName = 'partly-sunny-outline';
      if (item.type === 'bar') iconName = 'wine-outline';
      if (item.type === 'vip') iconName = 'star-outline';

      return (
        <TouchableOpacity
          style={[styles.tableGridCard, { backgroundColor: isOccupied ? colors.accentSoft : colors.card, borderColor: isOccupied ? colors.danger : colors.border }]}
          onPress={() => handleTablePress(item)}
          activeOpacity={0.8}
        >
          <View style={[styles.statusDot, isOccupied ? { backgroundColor: colors.danger } : { backgroundColor: colors.success }]} />
          <Ionicons name={iconName as any} size={40} color={isOccupied ? colors.danger : colors.text} style={{ marginBottom: 10 }} />
          <Text style={[styles.gridTableName, { color: colors.text }, isOccupied && { color: colors.danger }]}>{item.name}</Text>

          <Text style={[styles.gridTableStatus, isOccupied ? { color: colors.danger } : { color: colors.success }]}>
            {isOccupied ? (t.tableStatusOccupied || 'Ocupada') : (t.tableStatusFree || 'Libre')}
          </Text>
          {assignedWaiterName ? (
            <Text
              style={[styles.gridTableWaiter, { color: colors.mutedText }]}
              numberOfLines={2}
            >
              {t.tableWaiterLabel || 'Mesero'}: {assignedWaiterName}
            </Text>
          ) : null}
        </TouchableOpacity>
      )
    }}
  />;
}
