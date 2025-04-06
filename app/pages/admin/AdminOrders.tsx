import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../redux/slices/orderSlice";
import axios from "axios";
import { RootState, AppDispatch } from "../../redux/store";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getUserData } from '../../utils/TokenManager';

const API_URL = "http://192.168.144.237:4000/api";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const AdminOrdersScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, status, error } = useSelector((state: RootState) => state.order);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchOrders());
    
    // Set up push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        registerTokenWithServer(token);
      }
    });

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('Notification response:', response);
        
        // Handle navigation if the notification has screen info
        const data = response.notification.request.content.data;
        if (data && data.screen) {
          // Navigate to the screen specified in notification
          // navigation.navigate(data.screen, data.params);
          console.log('Should navigate to:', data.screen, data.params);
        }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [dispatch]);

  const registerTokenWithServer = async (expoPushToken: string) => {
    try {
      // Get auth token securely
      const authToken = await getToken();
  
      // Get userId securely from stored user data
      let userId;
      try {
        const userData = await getUserData();
        userId = userData?._id || userData?.id;
        console.log('Retrieved userId from SecureStore:', userId);
      } catch (err) {
        console.log('Could not retrieve userId, continuing without it');
      }
  
      // Gather device information
      const deviceInfo = {
        platform: Device.osName || 'unknown',
        model: Device.modelName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
      };
  
      // Build request payload
      const data: any = {
        expoPushToken,
        deviceInfo,
      };
  
      // Optionally add userId if present
      if (userId) {
        data.userId = userId.toString().trim();
        console.log('Adding userId to registration request:', data.userId);
      }
  
      // Set up headers if token exists
      const config: any = {};
      if (authToken) {
        config.headers = {
          'Authorization': `Bearer ${authToken}`,
        };
      }
  
      console.log('Registering push token with data:', JSON.stringify(data));
  
      // Send the request
      const response = await axios.post(
        `${API_URL}/notifications/register-token`,
        data,
        config
      );
  
      console.log('Push token registered with server:', response.data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Failed to register push token with server:', errorMessage);
  
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
  
      return { success: false, error: errorMessage };
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      
      // Get the token
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      console.log('Expo Push Token:', token);
    } else {
      alert('Must use physical device for Push Notifications');
    }
    
    return token;
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
  
      // Define valid statuses
      const validStatuses = ['Processing', 'Delivered', 'Cancelled'];
  
      // Normalize status if needed
      let statusToSend = newStatus === "Canceled" ? "Cancelled" : newStatus;
  
      if (!validStatuses.includes(statusToSend)) {
        throw new Error(`Invalid status value: ${statusToSend}`);
      }
  
      // Securely get admin ID from stored user data
      const userData = await getUserData();
      const adminId = userData?._id || userData?.id;
  
      if (!adminId) {
        throw new Error('Admin ID not found in secure storage.');
      }
  
      // Send update request
      await axios.put(
        `${API_URL}/order/${orderId}/status`,
        {
          status: statusToSend,
          adminId, // Include admin ID for tracking
        }
      );
  
      dispatch(fetchOrders());
    } catch (error: any) {
      console.error("Failed to update order status:", error.response?.data || error.message);
      alert(`Error updating order: ${error.response?.data?.message || error.message}`);
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
              
              {/* Handle missing user or missing user.name */}
              <Text style={styles.orderUser}>
                {`User: ${item.user ? (item.user.name || item.user.email || 'Unknown') : 'Unknown'}`}
              </Text>
          
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.approveButton]}
                  onPress={() => updateOrderStatus(item._id, "Delivered")}
                  disabled={updatingOrderId === item._id}
                >
                  <Text style={styles.buttonText}>Delivered</Text>
                </TouchableOpacity>
          
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => updateOrderStatus(item._id, "Cancelled")}
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
