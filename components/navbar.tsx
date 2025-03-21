import React, { useContext, useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Image, Animated, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { UserContext } from "../context/UserContext";
import { CartContext } from "../context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// This is a shared state to ensure the sidebar state is consistent
const sidebarState = {
  isOpen: false,
  toggleSidebar: null
};

export default function Navbar({ isUpperNavbar = false, isSidebar = false }) {
  const router = useRouter();
  const { user, setUser } = useContext(UserContext);
  const { cart } = useContext(CartContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const sidebarAnimation = useRef(new Animated.Value(-280)).current;
  const overlayAnimation = useRef(new Animated.Value(0)).current;
  const [profileImage, setProfileImage] = useState(null);
  
  // Define all menu items that will be used
  const menuItems = ["home", "products", "users", "orders", "profile"];
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  // Initialize animations for each menu item properly
  const itemAnimations = useRef({}).current;

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.post(
          "http://192.168.100.171:4000/api/auth/user",
          { token }
        );

        const userData = response.data.user;
        
        // Update user data in context and state
        setUserName(userData.username);
        setUserEmail(userData.email);
        setProfileImage(userData.profilePicture?.url || null);
        
        // Update the user context with fetched data
        setUser && setUser({
          ...userData,
          role: userData.role || "customer"
        });
        
        setIsAdmin(userData.role === "admin");
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        // Alert may not be defined, use console.error instead
        console.error("Error fetching user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  
  // Initialize all animations in the ref
  useEffect(() => {
    menuItems.forEach(item => {
      if (!itemAnimations[item]) {
        itemAnimations[item] = new Animated.Value(0);
      }
    });
  }, []);

  useEffect(() => {
    if (user && user.role) {
      setIsAdmin(user.role === "admin");
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Function to toggle sidebar visibility
  const toggleSidebar = (open) => {
    const toValue = open !== undefined ? open : !sidebarOpen;
    console.log("Toggling sidebar:", toValue);
    
    // Update shared state
    sidebarState.isOpen = toValue;
    
    Animated.parallel([
      Animated.timing(sidebarAnimation, {
        toValue: toValue ? 0 : -280,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnimation, {
        toValue: toValue ? 0.5 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    // Animate menu items with staggered effect
    if (toValue) {
      menuItems.forEach((item, index) => {
        // Make sure the animation exists before using it
        if (itemAnimations[item]) {
          Animated.timing(itemAnimations[item], {
            toValue: 1,
            duration: 400,
            delay: 100 + (index * 70),
            useNativeDriver: true,
          }).start();
        }
      });
    } else {
      // Reset animations when closing
      menuItems.forEach(item => {
        if (itemAnimations[item]) {
          itemAnimations[item].setValue(0);
        }
      });
    }
    
    setSidebarOpen(toValue);
  };

  // Store the toggleSidebar function in the shared state
  useEffect(() => {
    if (isSidebar) {
      sidebarState.toggleSidebar = toggleSidebar;
    }
  }, [isSidebar]);

  const navigateTo = (path, itemName) => {
    if (router?.push) {
      setActiveItem(itemName);
      router.push(path);
      // Close sidebar after navigation
      toggleSidebar(false);
    } else {
      console.warn("Navigation attempted before the router was ready");
    }
  };

  // Function to handle hamburger press
  const handleHamburgerPress = () => {
    console.log("Hamburger pressed!");
    
    // If sidebar component is already mounted, use its toggle function
    if (sidebarState.toggleSidebar) {
      sidebarState.toggleSidebar(true);
    } else {
      console.warn("Sidebar component not mounted yet");
    }
  };

  if (isUpperNavbar) {
    return (
      <LinearGradient colors={["#ffffff", "#ffffff"]} style={styles.topNavbar}>
        <TouchableOpacity 
          onPress={handleHamburgerPress} 
          style={styles.hamburgerMenu} 
          activeOpacity={0.6} 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="menu-outline" size={28} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Image source={require("../assets/images/logo.png")} style={styles.logo} />
          <Text style={styles.logoName}>Jewel</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#aaa" />
        </View>
        
        <TouchableOpacity style={styles.cartContainer} onPress={() => router.push("/pages/Cart")}>
          <Ionicons name="cart-outline" size={28} color="#000" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Sidebar implementation
  if (isSidebar) {
    // Force initial render with sidebar state
    useEffect(() => {
      // Check if the sidebar should be open based on shared state
      if (sidebarState.isOpen !== sidebarOpen) {
        setSidebarOpen(sidebarState.isOpen);
        sidebarAnimation.setValue(sidebarState.isOpen ? 0 : -280);
        overlayAnimation.setValue(sidebarState.isOpen ? 0.5 : 0);
      }
    }, []);

    // Function to render a sidebar item with animation
    const renderSidebarItem = (icon, text, path, itemKey) => {
      const isActive = activeItem === itemKey;
      
      // Safety check: make sure the animation exists
      if (!itemAnimations[itemKey]) {
        itemAnimations[itemKey] = new Animated.Value(0);
      }
      
      const translateX = itemAnimations[itemKey].interpolate({
        inputRange: [0, 1],
        outputRange: [-50, 0],
      });
      
      const opacity = itemAnimations[itemKey].interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return (
        <Animated.View 
          style={{ 
            opacity,
            transform: [{ translateX }] 
          }}
        >
          <TouchableOpacity
            style={[
              styles.sidebarItem,
              isActive && styles.activeSidebarItem
            ]}
            onPress={() => navigateTo(path, itemKey)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={isActive ? ['#FF6B98', '#FF8DC7'] : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.itemIconContainer}
            >
              <Ionicons name={icon} size={24} color={isActive ? "#fff" : "#555"} />
            </LinearGradient>
            <Text style={[styles.sidebarText, isActive && styles.activeSidebarText]}>{text}</Text>
            {isActive && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    };

    return (
      <View style={styles.sidebarContainer} pointerEvents="box-none">
        {/* Overlay for when sidebar is open */}
        <Animated.View 
          style={[
            styles.overlay, 
            { 
              opacity: overlayAnimation,
              // Only enable pointer events when visible
              pointerEvents: sidebarOpen ? 'auto' : 'none' 
            }
          ]}
          onTouchStart={() => toggleSidebar(false)}
        />
        
        {/* Sidebar */}
        <Animated.View 
          style={[
            styles.sidebar, 
            { transform: [{ translateX: sidebarAnimation }] }
          ]}
        >
          {/* Header container */}
          <View style={styles.sidebarHeaderContainer}>
            {/* Close button moved outside of userInfoContainer */}
            <TouchableOpacity 
              style={styles.closeSidebar}
              onPress={() => toggleSidebar(false)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close-outline" size={28} color="#333" />
            </TouchableOpacity>
            
            {!loading && (
              <View style={styles.userInfoContainer}>
                <View style={styles.userAvatarContainer}>
                  <Image
                    source={{
                      uri: profileImage || "https://www.example.com/default-avatar.png",
                    }}
                    style={styles.userAvatar}
                  />
                </View>
                <Text style={styles.userName}>{userName || (user && user.username) || "Guest User"}</Text>
                <Text style={styles.userRole}>{isAdmin ? "Administrator" : "Customer"}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.sidebarContent}>
            {renderSidebarItem(
              isAdmin ? "grid-outline" : "home-outline",
              isAdmin ? "Dashboard" : "Home",
              isAdmin ? "/pages/admin/AdminDashboard" : "/",
              "home"
            )}

            {isAdmin ? (
              <>
                {renderSidebarItem("cube-outline", "Products", "/pages/admin/Products", "products")}
                {renderSidebarItem("people-outline", "Users", "/pages/Users", "users")}
                {renderSidebarItem("clipboard-outline", "Orders", "/pages/admin/Orders", "orders")}
              </>
            ) : (
              renderSidebarItem("clipboard-outline", "Orders", "/pages/Orders", "orders")
            )}

            {renderSidebarItem(
              "person-outline",
              "Profile",
              user ? "/pages/UserProfile" : "/pages/SignUpScreen",
              "profile"
            )}
          </View>
          
          <View style={styles.sidebarFooter}>
            
          </View>
        </Animated.View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  topNavbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    zIndex: 100,
  },
  hamburgerMenu: {
    padding: 10,
    marginRight: 5,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 8,
    borderRadius: 15,
  },
  logoName: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    color: "#000",
    fontSize: 16,
  },
  cartContainer: {
    position: "relative",
    marginLeft: 15,
    padding: 8,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: -2,
    backgroundColor: "#FF6B98",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Sidebar styles
  sidebarContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 1001,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 280,
    height: "100%",
    backgroundColor: "#fff",
    zIndex: 1002,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sidebarHeaderContainer: {
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: 'rgba(255, 107, 152, 0.05)',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
  },
  closeSidebar: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 50 : 25,
    right: 15,
    zIndex: 10,
    padding: 8,
  },
  userInfoContainer: {
    alignItems: "center",
    padding: 20,
  },
  userAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 10,
  },
  userAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 5,
  },
  userRole: {
    fontSize: 14,
    color: "#FF6B98",
    marginTop: 3,
  },
  sidebarContent: {
    paddingVertical: 10,
    flex: 1,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 12,
    position: 'relative',
  },
  activeSidebarItem: {
    backgroundColor: 'rgba(255, 107, 152, 0.1)',
  },
  itemIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sidebarText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },
  activeSidebarText: {
    color: "#FF6B98",
    fontWeight: "600",
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    height: '50%',
    width: 4,
    backgroundColor: '#FF6B98',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  sidebarFooter: {
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  footerCard: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B98",
    marginTop: 8,
    marginBottom: 4,
  },
  footerCardText: {
    fontSize: 13,
    color: "#666",
    textAlign: 'center',
    marginBottom: 10,
  },
  footerButton: {
    backgroundColor: "#FF6B98",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 5,
  },
  footerButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
});