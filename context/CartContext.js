import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from 'expo-secure-store';
import { UserContext } from "./UserContext";
import { getUserData } from '.././app/utils/TokenManager'; // Adjust the import path as necessary

export const CartContext = createContext(null);

// Constants for cart storage
const CART_KEY_PREFIX = 'cart_';

export const CartProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [cart, setCart] = useState([]);

  // Get cart key based on the logged-in user
  const getCartKey = async () => {
    // Try to get user from context first
    if (user && (user._id || user.id)) {
      return `${CART_KEY_PREFIX}${user._id || user.id}`;
    }
    
    // If no user in context, try to get from SecureStore
    try {
      const userData = await getUserData();
      if (userData && (userData._id || userData.id)) {
        return `${CART_KEY_PREFIX}${userData._id || userData.id}`;
      }
    } catch (error) {
      console.error("Error getting user data:", error);
    }
    
    // Fallback to guest cart if no user found
    return `${CART_KEY_PREFIX}guest`;
  };

  // Load cart from SecureStore for the current user
  const loadCart = async () => {
    try {
      const cartKey = await getCartKey();
      const storedCart = await SecureStore.getItemAsync(cartKey);
      setCart(storedCart ? JSON.parse(storedCart) : []);
    } catch (error) {
      console.error("Error loading cart:", error);
      // Fallback to empty cart if there's an error
      setCart([]);
    }
  };

  // Save cart to SecureStore for the current user
  const saveCart = async (updatedCart) => {
    try {
      const cartKey = await getCartKey();
      await SecureStore.setItemAsync(cartKey, JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  // Clear cart for the current user
  const clearCart = async () => {
    try {
      const cartKey = await getCartKey();
      await SecureStore.deleteItemAsync(cartKey);
      setCart([]); // Clear current cart in state
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // Sync cart with SecureStore whenever user changes
  useEffect(() => {
    loadCart();
  }, [user]);

  // Save cart to SecureStore whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      saveCart(cart);
    }
  }, [cart]);

  // Add an item to the cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  // Decrease item quantity in the cart
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

  // Get total price of items in the cart
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        decreaseQuantity,
        getTotalPrice,
        clearCart,
        loadCart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};