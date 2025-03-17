import React, { useContext } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { CartContext } from "../../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ✅ Use expo-router

export default function CartScreen() {
  const { cart, addToCart, decreaseQuantity, getTotalPrice } = useContext(CartContext);
  const router = useRouter(); // ✅ Use useRouter instead of useNavigation

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      {cart.length === 0 ? (
        <Text>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.details}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>₱{item.price.toFixed(2)}</Text>
                </View>

                {/* Quantity Controls */}
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => decreaseQuantity(item.id)}>
                    <Ionicons name="remove-circle-outline" size={24} color="red" />
                  </TouchableOpacity>

                  <Text style={styles.quantity}>{item.quantity}</Text>

                  <TouchableOpacity onPress={() => addToCart(item)}>
                    <Ionicons name="add-circle-outline" size={24} color="green" />
                  </TouchableOpacity>
                </View>

                {/* Total Price per Product */}
                <Text style={styles.totalItemPrice}>
                  ₱{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            )}
          />

          {/* Total Price Section */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: ₱{getTotalPrice()}</Text>

            {/* ✅ Checkout Button */}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push("/pages/Checkout")} // ✅ expo-router navigation
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  image: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 14, color: "#28a745" },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantity: { fontSize: 16, fontWeight: "bold", marginHorizontal: 10 },
  totalItemPrice: { fontSize: 16, fontWeight: "bold", color: "#000" },
  totalContainer: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  totalText: { fontSize: 18, fontWeight: "bold" },

  /* ✅ Checkout Button Styles */
  checkoutButton: {
    backgroundColor: "#f56a79",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});