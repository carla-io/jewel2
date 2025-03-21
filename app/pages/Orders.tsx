import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOrders } from "../redux/slices/orderSlice"; // ✅ Use fetchUserOrders
import { RootState, AppDispatch } from "../redux/store";

export default function OrdersScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { orders = [], status, error } = useSelector((state: RootState) => state.order);
  const [selectedTab, setSelectedTab] = useState("Processing");
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch User ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const storedUserId = parsedUser._id || parsedUser.id;
          setUserId(storedUserId);
          console.log("Fetched User ID:", storedUserId);
        } else {
          setUserId(null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserId(null);
      }
    };

    fetchUserId();
  }, []);

  // Fetch Orders when user logs in
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserOrders(userId)); // ✅ Fetch orders based on user ID
    }
  }, [dispatch, userId]);

  // Debug: Check if orders are fetched
  useEffect(() => {
    console.log("Orders from Redux:", orders);
  }, [orders]);

  // Filter Orders by Selected Tab
  const filteredOrders = orders.filter(
    (order: any) => order.orderStatus === selectedTab
  );

  // Debug: Check filtered orders
  useEffect(() => {
    console.log("Filtered Orders:", filteredOrders);
  }, [filteredOrders]);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["Processing", "Shipped", "Delivered"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {status === "loading" ? (
        <ActivityIndicator size="large" color="#f56a79" />
      ) : error ? (
        <Text style={styles.errorText}>{typeof error === "string" ? error : JSON.stringify(error)}</Text>
      ) : userId ? (
        <FlatList
          data={filteredOrders}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text style={styles.orderTitle}>{`Order #${item._id}`}</Text>
              <Text style={styles.orderStatus}>{`Status: ${item.orderStatus}`}</Text>

              {/* Products */}
              <Text style={styles.sectionTitle}>Products:</Text>
              {item.orderItems.map((product: any, index: number) => (
                <View key={index} style={styles.productItem}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productQuantity}>{`Qty: ${product.quantity}`}</Text>
                    <Text style={styles.productPrice}>{`₱${product.price.toFixed(2)}`}</Text>
                  </View>
                </View>
              ))}

              {/* Total Price & Payment Mode */}
              <Text style={styles.totalPrice}>{`Total Price: ₱${item.totalPrice.toFixed(2)}`}</Text>
              <Text style={styles.paymentMethod}>{`Payment: ${item.modeOfPayment}`}</Text>
            </View>
          )}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
        />
      ) : (
        <Text style={styles.emptyText}>Please log in to view your orders.</Text>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
  },
  tabButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  activeTab: { backgroundColor: "#f56a79" },
  tabText: { fontSize: 16, color: "#333" },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  orderItem: { backgroundColor: "#f8f8f8", padding: 15, borderRadius: 8, marginBottom: 15 },
  orderTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  orderStatus: { fontSize: 14, fontWeight: "bold", color: "#555", marginBottom: 5 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  productDetails: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  productQuantity: { fontSize: 12, color: "#555" },
  productPrice: { fontSize: 14, fontWeight: "bold", color: "#f56a79" },
  totalPrice: { fontSize: 14, fontWeight: "bold", marginTop: 5, color: "#f56a79" },
  paymentMethod: { fontSize: 14, fontWeight: "bold", color: "#444" },
  emptyText: { fontSize: 16, color: "#aaa", textAlign: "center", marginTop: 20 },
  errorText: { color: "red", textAlign: "center", fontSize: 16 },
});

export default OrdersScreen;