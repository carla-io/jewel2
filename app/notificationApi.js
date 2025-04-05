// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import { Platform } from 'react-native';
// import api from './api';
// import TokenStore from './tokenStore';


// // Configure notification handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });


// // Register device for push notifications
// export const registerForPushNotifications = async () => {
//   try {
//     if (!Device.isDevice) {
//       console.log('Must use physical device for Push Notifications');
//       return null;
//     }


//     const { status: existingStatus } = await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;


//     if (existingStatus !== 'granted') {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }


//     if (finalStatus !== 'granted') {
//       console.log('Failed to get push token for push notification!');
//       return null;
//     }


//     const token = (await Notifications.getExpoPushTokenAsync()).data;
//     console.log('Expo push token:', token);


//     // Save token to backend if user is authenticated
//     const authToken = await TokenStore.getToken();
//     if (authToken) {
//       try {
//         await api.savePushToken({ token });
//         console.log('Push token saved to backend');
//       } catch (error) {
//         console.error('Error saving push token to backend:', error);
//       }
//     }


//     // Android specific configuration
//     if (Platform.OS === 'android') {
//       // Default channel for all notifications
//       await Notifications.setNotificationChannelAsync('default', {
//         name: 'default',
//         importance: Notifications.AndroidImportance.MAX,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF231F7C',
//       });


//       // Special channel for promotions
//       await Notifications.setNotificationChannelAsync('promotions', {
//         name: 'Promotions',
//         importance: Notifications.AndroidImportance.HIGH,
//         vibrationPattern: [0, 250, 250, 250],
//         lightColor: '#FF6347',
//         sound: 'default',
//       });
//     }


//     return token;
//   } catch (error) {
//     console.error('Error registering for push notifications:', error);
//     return null;
//   }
// };


// // Setup general notification handler (for orders)
// export const setupNotificationHandler = (navigation) => {
//   const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
//     const data = response.notification.request.content.data;
   
//     if (data.orderId) {
//       // Navigate to order details screen when notification is tapped
//       navigation.navigate('OrderDetails', { orderId: data.orderId });
//     }
//   });


//   return responseListener;
// };


// // Setup promotion-specific notification handler
// export const setupPromotionNotificationHandler = (navigation) => {
//   const notificationListener = Notifications.addNotificationReceivedListener(notification => {
//     console.log('Promotion notification received:', notification);
//   });


//   const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
//     const data = response.notification.request.content.data;
//     console.log('Promotion notification response:', data);
   
//     // Navigate to product detail when promotion notification is tapped
//     if (data?.screen === 'ProductDetail' && data?.productId) {
//       navigation.navigate('ProductDetail', {
//         productId: data.productId,
//         promotionId: data.promotionId
//       });
//     }
//   });


//   return () => {
//     Notifications.removeNotificationSubscription(notificationListener);
//     Notifications.removeNotificationSubscription(responseListener);
//   };
// };


// // Send local notification for order status updates
// export const sendOrderStatusNotification = async (order) => {
//   const statusMessages = {
//     'Processing': 'Your order is being processed',
//     'Shipped': 'Your order has been shipped',
//     'Delivered': 'Your order has been delivered',
//     'Cancelled': 'Your order has been cancelled'
//   };


//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: `Order ${order.orderNumber} Update`,
//       body: statusMessages[order.orderStatus] || 'Your order status has been updated',
//       data: { orderId: order._id },
//       sound: 'default',
//     },
//     trigger: null, // Send immediately
//   });
// };


// // Send local notification for promotions
// export const sendPromotionNotification = async (promotion) => {
//   await Notifications.scheduleNotificationAsync({
//     content: {
//       title: `Special Offer: ${promotion.title}`,
//       body: `${promotion.description} - Get ${promotion.discountPercentage}% off!`,
//       data: {
//         screen: 'ProductDetail',
//         productId: promotion.product._id,
//         promotionId: promotion._id
//       },
//       sound: 'default',
//       channelId: 'promotions', // Use the promotions channel on Android
//     },
//     trigger: null, // Send immediately
//   });
// };
