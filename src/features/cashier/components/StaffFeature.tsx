import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Platform, LayoutAnimation } from 'react-native';
import { styles } from './style/CashierStyles';
import { Employee } from './CashierData';

export const StaffFeature = ({ staff, setStaff, showToast }: any) => {
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [customPayment, setCustomPayment] = useState<string>('0');

  const openEmployeeModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCustomPayment(employee.basePay.toString());
    setEmployeeModalVisible(true);
  };

  const confirmEmployeePayment = () => {
    if (selectedEmployee) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStaff((prev: Employee[]) => prev.filter(e => e.id !== selectedEmployee.id));
      setEmployeeModalVisible(false);
      showToast(`💵 Turno pagado a ${selectedEmployee.name} por $${Number(customPayment).toLocaleString('es-CO')}`);
      setSelectedEmployee(null);
    }
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <View style={styles.employeeCard}>
      <View style={styles.employeeHeader}>
        <View style={styles.employeeInfoBox}>
          <View style={styles.employeeAvatar}><Text style={styles.employeeInitials}>{item.name.substring(0, 2).toUpperCase()}</Text></View>
          <View><Text style={styles.employeeName}>{item.name}</Text><Text style={styles.employeeRole}>{item.role}</Text></View>
        </View>
        <View style={styles.statusDot} />
      </View>
      <View style={styles.employeeDetailsBox}>
        <View style={styles.timeBox}><Text style={styles.timeLabel}>Horario:</Text><Text style={styles.timeValue}>{item.startTime} - {item.endTime}</Text></View>
        <View style={styles.timeBox}><Text style={styles.timeLabel}>Tarifa Base:</Text><Text style={styles.payValue}>${item.basePay.toLocaleString('es-CO')}</Text></View>
      </View>
      <TouchableOpacity style={styles.payShiftButton} onPress={() => openEmployeeModal(item)}>
        <Text style={styles.payShiftButtonText}>Liquidar y Pagar Turno</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.content}>
      <FlatList data={staff} keyExtractor={item => item.id} renderItem={renderEmployee} contentContainerStyle={styles.listPadding} ListEmptyComponent={<Text style={styles.emptyText}>No hay personal activo en este momento.</Text>} />
      
      <Modal animationType="slide" transparent={true} visible={employeeModalVisible} onRequestClose={() => setEmployeeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pagar Turno</Text>
              <TouchableOpacity onPress={() => setEmployeeModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>

            {selectedEmployee && (
              <View style={styles.employeePaymentContainer}>
                <Text style={styles.empModalName}>{selectedEmployee.name}</Text>
                <Text style={styles.empModalRole}>{selectedEmployee.role}</Text>
                <View style={styles.empModalDetails}>
                  <Text style={styles.empModalLabel}>Turno agendado:</Text>
                  <Text style={styles.empModalValue}>{selectedEmployee.startTime} - {selectedEmployee.endTime}</Text>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Monto a pagar (Modificable si se retira antes):</Text>
                  <View style={styles.currencyInputWrapper}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput style={[styles.moneyInput, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}]} keyboardType="numeric" value={customPayment} onChangeText={setCustomPayment} selectTextOnFocus={true} underlineColorAndroid="transparent" />
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.payEmployeeBtn} onPress={confirmEmployeePayment}>
              <Text style={styles.modalAcceptText}>Confirmar Pago</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};