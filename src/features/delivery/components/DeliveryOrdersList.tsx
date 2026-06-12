import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

interface Order {
  id: string;
  customerName: string;
  address: string;
  status: 'Listo para entregar';
}

const generateMockOrders = (startIndex: number, count: number): Order[] => {
  const newOrders: Order[] = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    newOrders.push({
      id: `ORD-${1000 + i}`,
      customerName: `Cliente ${i + 1}`,
      address: `Calle Falsa ${123 + i}, Barrio Centro`,
      status: 'Listo para entregar'
    });
  }
  return newOrders;
};

export const DeliveryOrdersList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadMoreOrders();
    setInitialLoading(false);
  }, []);

  const loadMoreOrders = () => {
    if (loading) return;
    
    setLoading(true);
    
    setTimeout(() => {
      const currentLength = orders.length;
      const newOrders = generateMockOrders(currentLength, 10);
      setOrders([...orders, ...newOrders]);
      setLoading(false);
    }, 1500);
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{item.id}</Text>
        <Text style={styles.orderStatus}>{item.status}</Text>
      </View>
      <Text style={styles.customerName}>🧑 {item.customerName}</Text>
      <Text style={styles.addressText}>📍 {item.address}</Text>
      <TouchableOpacity style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>Aceptar Viaje</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Buscando más pedidos...</Text>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Repartidor - saborExpress</Text>
        <Text style={styles.subtitle}>Pedidos listos para entrega</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.5} 
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6F61',
    backgroundColor: '#FFF0EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  customerName: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 14,
  }
});