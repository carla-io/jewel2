import React, { createContext, useState, useEffect } from "react";
import { 
  getUserData, 
  storeUserData, 
  isAuthenticated 
} from ".././app/utils/TokenManager"; // Import the relevant functions

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Function to load user data using TokenManager
  const loadUser = async () => {
    try {
      const userData = await getUserData();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
    }
  };

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Listen for authentication state
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated && user) {
        // If not authenticated but we have user data, clear it
        setUser(null);
      } else if (authenticated && !user) {
        // If authenticated but no user data, reload it
        loadUser();
      }
    };

    const interval = setInterval(checkAuth, 1000); // Check for changes every second
    return () => clearInterval(interval); // Cleanup on unmount
  }, [user]);

  // Update the context's setUser to also store in SecureStore
  const updateUser = async (userData) => {
    try {
      if (userData) {
        await storeUserData(userData);
      } else {
        // If userData is null, it means we're logging out
        // You might want to clear auth data here or handle it elsewhere
      }
      setUser(userData);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Get unique cart key for the logged-in user
  const getCartKey = () => {
    return user && (user._id || user.id) ? `cart_${user._id || user.id}` : "cart_guest";
  };

  return (
    <UserContext.Provider value={{ user, setUser: updateUser, getCartKey, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};