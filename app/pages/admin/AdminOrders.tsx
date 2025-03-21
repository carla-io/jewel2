import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import axios from "axios";
import { RootState, AppDispatch } from "../../redux/store";

const API_URL = "http://192.168.100.171:4000/api/order";

const AdminOrdersScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, status, error } = useSelector((state: RootState) => state.order);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await axios.put(`${API_URL}/${orderId}/status`, { status: newStatus }); // ✅ Correct key
      dispatch(fetchOrders()); // Refresh orders after update
    } catch (error) {
      console.error("Failed to update order status:", error.response?.data || error.message);
    } finally {
      setUpdatingOrderId(null);
    }
};


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Order Management</Text>

      {status === "loading" ? (
        <ActivityIndicator size="large" color="#f56a79" />
      ) : error ? (
        <Text style={styles.errorText}>{error.toString()}</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text style={styles.orderTitle}>{`Order #${item._id}`}</Text>
              <Text style={styles.orderStatus}>{`Status: ${item.orderStatus}`}</Text>


              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.approveButton]}
                  onPress={() => updateOrderStatus(item._id, "Approved")}
                  disabled={updatingOrderId === item._id}
                >
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => updateOrderStatus(item._id, "Canceled")}
                  disabled={updatingOrderId === item._id}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  header: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  orderItem: { backgroundColor: "#f8f8f8", padding: 15, borderRadius: 8, marginBottom: 15 },
  orderTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  orderStatus: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between" },
  button: { flex: 1, padding: 10, borderRadius: 5, alignItems: "center", marginHorizontal: 5 },
  approveButton: { backgroundColor: "#28a745" },
  cancelButton: { backgroundColor: "#dc3545" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  errorText: { color: "red", textAlign: "center", fontSize: 16 },
});

export default AdminOrdersScreen;
