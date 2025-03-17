import React, { useState, useContext, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartContext } from "../../context/CartContext";
import { useDispatch, useSelector } from "react-redux";
import { createOrder, resetOrderStatus } from "../redux/slices/orderSlice";

export default function CheckoutScreen() {
  const { cart, getTotalPrice, clearCart } = useContext(CartContext);
  const router = useRouter();
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.order);

  const [userId, setUserId] = useState(null);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUserId(parsedUser._id || parsedUser.id);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserId();
  }, []);

  // Ensure price calculations are numbers
  const itemsPrice = parseFloat(getTotalPrice()) || 0;
  const taxPrice = itemsPrice * 0.12;
  const shippingPrice = 50;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  // State for user input
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("COD");

  // Prevent auto-ordering by using a state flag
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Handle Order Placement
  const handlePlaceOrder = () => {
    if (!userId) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    if (!address || !city || !phoneNo || !postalCode || !country) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (orderPlaced) return; // Prevent multiple submissions

    setOrderPlaced(true); // Mark order as placed

    const orderData = {
      userId,
      orderItems: cart.map((item) => ({
        product: item.productId || item.id, // Ensures correct product ID
        name: item.name,
        quantity: item.quantity,
        image: item.image,
        price: item.price,
      })),
      shippingInfo: { address, city, phoneNo, postalCode, country },
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      modeOfPayment,
    };

    dispatch(createOrder(orderData));
  };

  // Handle success or failure
  useEffect(() => {
    if (status === "succeeded" && orderPlaced) {
      Alert.alert("Success", "Order placed successfully!");
      clearCart();
      dispatch(resetOrderStatus());
      setOrderPlaced(false); // Reset order state
      router.push("/pages/Orders");
    } else if (status === "failed" && error && orderPlaced) {
      Alert.alert("Error", error);
      dispatch(resetOrderStatus());
      setOrderPlaced(false); // Reset order state
    }
  }, [status, error]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      {/* Address Input Fields */}
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Phone Number" value={phoneNo} onChangeText={setPhoneNo} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Postal Code" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Country" value={country} onChangeText={setCountry} />

      {/* Payment Method Selection */}
      <Text style={styles.label}>Payment Method:</Text>
      <View style={styles.paymentOptions}>
        <TouchableOpacity onPress={() => setModeOfPayment("COD")} style={[styles.paymentButton, modeOfPayment === "COD" && styles.selected]}>
          <Text style={styles.paymentText}>Cash on Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModeOfPayment("Online Payment")} style={[styles.paymentButton, modeOfPayment === "Online Payment" && styles.selected]}>
          <Text style={styles.paymentText}>Online Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Order Summary */}
      <View style={styles.summary}>
        <Text>Items Price: ₱{itemsPrice.toFixed(2)}</Text>
        <Text>Tax (12%): ₱{taxPrice.toFixed(2)}</Text>
        <Text>Shipping Fee: ₱{shippingPrice.toFixed(2)}</Text>
        <Text style={styles.totalPrice}>Total: ₱{totalPrice.toFixed(2)}</Text>
      </View>

      {/* Place Order Button */}
      <TouchableOpacity style={styles.orderButton} onPress={handlePlaceOrder} disabled={status === "loading" || orderPlaced}>
        <Text style={styles.orderButtonText}>
          {status === "loading" ? "Placing Order..." : "Place Order"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 10 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  paymentOptions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  paymentButton: { flex: 1, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginHorizontal: 5 },
  selected: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  paymentText: { color: "#fff", fontWeight: "bold" },
  summary: { marginTop: 15, padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 8 },
  totalPrice: { fontSize: 18, fontWeight: "bold", marginTop: 5 },
  orderButton: { backgroundColor: "#ff6b6b", padding: 12, borderRadius: 8, marginTop: 15, alignItems: "center" },
  orderButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default CheckoutScreen;
