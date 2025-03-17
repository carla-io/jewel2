import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "./UserContext"; // Import UserContext

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useContext(UserContext); // Get current user
  const [cart, setCart] = useState([]);

  // Generate a unique cart key based on user ID
  const getCartKey = () => {
    return user && (user._id || user.id) ? `cart_${user._id || user.id}` : "cart_guest";
  };

  // Load cart from AsyncStorage
  const loadCart = async () => {
    try {
      const cartKey = getCartKey();
      const storedCart = await AsyncStorage.getItem(cartKey);
      setCart(storedCart ? JSON.parse(storedCart) : []);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  // Save cart to AsyncStorage
  const saveCart = async (updatedCart) => {
    try {
      const cartKey = getCartKey();
      await AsyncStorage.setItem(cartKey, JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  const clearCart = async () => {
    try {
      const cartKey = getCartKey();
      await AsyncStorage.removeItem(cartKey); // Clear AsyncStorage cart
      setCart([]); // Clear cart state
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Load cart when user logs in
  useEffect(() => {
    if (!user) {
      console.warn("User not found. Please log in again.");
    } else {
      loadCart();
    }
  }, [user]);

  // Save cart when cart state changes
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      return existingItem
        ? prevCart.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...prevCart, { ...item, quantity: 1 }];
    });
  };

  // Decrease quantity or remove item
  const decreaseQuantity = (itemId) => {
    setCart((prevCart) => 
      prevCart
        .map((cartItem) =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
        .filter((cartItem) => cartItem.quantity > 0)
    );
  };

  // Get total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, decreaseQuantity, getTotalPrice, clearCart, saveCart, loadCart,  }}>
      {children}
    </CartContext.Provider>
  );
};
