import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  Image,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserOrders } from "../redux/slices/orderSlice";
import { RootState, AppDispatch } from "../redux/store";
import { Ionicons } from "@expo/vector-icons"; // Make sure to install expo vector icons
import axios from "axios"; // Assuming you're already using axios

// Review Component

const ReviewModal = ({ 
  visible, 
  onClose, 
  productId, 
  productName, 
  productImage, 
  orderId,
  existingReview, // Add this prop to receive existing review data
  isEditing // Add this prop to indicate if we're editing an existing review
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const apiUrl = "http://192.168.100.171:4000";

  // Initialize with existing review data if editing
  useEffect(() => {
    if (isEditing && existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || "");
    } else {
      // Reset form when creating a new review
      setRating(0);
      setComment("");
    }
  }, [isEditing, existingReview, visible]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem("token");
      const userData = await AsyncStorage.getItem("user");
      
      if (!token || !userData) {
        Alert.alert("Error", "You need to be logged in to leave a review");
        return;
      }

      const user = JSON.parse(userData);
      const userId = user._id || user.id;
      const username = user.username || user.name || "Anonymous";
      
      if (!productId) {
        Alert.alert("Error", "Product information is missing");
        setSubmitting(false);
        return;
      }

      const reviewData = { userId, username, productId, orderId, rating, comment };

      // Use PUT for updating, POST for creating
      const endpoint = isEditing 
        ? `${apiUrl}/api/reviews/update` 
        : `${apiUrl}/api/reviews/add`;
      
      const method = isEditing ? 'put' : 'post';
      
      const response = await axios({
        method,
        url: endpoint,
        data: reviewData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });

      Alert.alert(
        "Success", 
        isEditing ? "Your review has been updated!" : "Your review has been submitted!"
      );
      
      onClose(true); // Pass true to indicate success
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          Alert.alert("Error", "Review endpoint not found. Please check your API configuration.");
        } else {
          Alert.alert("Error", `Failed to ${isEditing ? 'update' : 'submit'} review: ${error.response?.data?.message || "Please try again."}`);
        }
      } else {
        Alert.alert("Error", `Failed to ${isEditing ? 'update' : 'submit'} review. Please try again.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => onClose(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isEditing ? "Update Your Review" : "Write a Review"}
          </Text>
          
          <View style={styles.productPreview}>
            <Image source={{ uri: productImage }} style={styles.reviewProductImage} />
            <Text style={styles.reviewProductName}>{productName}</Text>
          </View>
          
          <Text style={styles.ratingLabel}>Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={rating >= star ? "star" : "star-outline"}
                  size={32}
                  color={rating >= star ? "#FFD700" : "#CCCCCC"}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.commentLabel}>Your Review</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience with this product..."
            multiline={true}
            numberOfLines={5}
            value={comment}
            onChangeText={setComment}
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? "Update Review" : "Submit Review"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Fetch a single review
const fetchReview = async (productId, userId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;
    
    const apiUrl = "http://192.168.100.171:4000";
    
    const response = await axios.get(
      `${apiUrl}/api/reviews/getSingle/${productId}/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (response.data.success && response.data.review) {
      return response.data.review;
    }
    return null;
  } catch (error) {
    console.error("Error fetching review:", error);
    return null;
  }
};

// Check if product has been reviewed
const hasBeenReviewed = async (orderId, productId) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const userData = await AsyncStorage.getItem("user");
    
    if (!token || !userData) return false;
    
    const user = JSON.parse(userData);
    const userId = user._id || user.id;
    
    const apiUrl = "http://192.168.100.171:4000";
    
    const response = await axios.get(
      `${apiUrl}/api/reviews/getSingle/${productId}/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error("Error checking review status:", error);
    return false;
  }
};

const OrdersScreen = () => {
  const dispatch = useDispatch();
  const { orders = [], status, error } = useSelector((state) => state.order);
  const [selectedTab, setSelectedTab] = useState("Processing");
  const [userId, setUserId] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({
    id: "",
    name: "",
    image: "",
    orderId: ""
  });
  const [reviewedProducts, setReviewedProducts] = useState({});
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditingReview, setIsEditingReview] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUserId(parsedUser._id || parsedUser.id);
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

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserOrders(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    const checkReviewedProducts = async () => {
      if (selectedTab === "Delivered" && orders.length > 0 && userId) {
        const deliveredOrders = orders.filter(
          (order) => order.orderStatus === "Delivered"
        );
        
        const reviewStatusMap = {};
        
        for (const order of deliveredOrders) {
          for (const product of order.orderItems) {
            const productId = product.product?._id || product.productId;
            if (!productId) continue;
            
            const key = `${order._id}-${productId}`;
            const reviewed = await hasBeenReviewed(order._id, productId);
            reviewStatusMap[key] = reviewed;
          }
        }
        
        setReviewedProducts(reviewStatusMap);
      }
    };
    
    checkReviewedProducts();
  }, [selectedTab, orders, userId, refreshReviews]);

  // View and edit existing review
  const handleViewReview = async (productId, name, image, orderId) => {
    if (!productId || !userId) return;
    
    try {
      const review = await fetchReview(productId, userId);
      
      if (review) {
        setExistingReview(review);
        setIsEditingReview(true);
        setSelectedProduct({
          id: productId,
          name,
          image,
          orderId
        });
        setReviewModalVisible(true);
      } else {
        Alert.alert("Error", "Could not retrieve your review. Please try again.");
      }
    } catch (error) {
      console.error("Error retrieving review:", error);
      Alert.alert("Error", "Failed to retrieve your review. Please try again.");
    }
  };

  // Create a new review
  const handleCreateReview = (productId, name, image, orderId) => {
    if (!productId) {
      Alert.alert("Error", "Unable to review this product. Product information is missing.");
      return;
    }
    
    setExistingReview(null);
    setIsEditingReview(false);
    setSelectedProduct({
      id: productId,
      name,
      image,
      orderId
    });
    setReviewModalVisible(true);
  };

  // Handle review modal close
  const handleReviewComplete = (success = false) => {
    setReviewModalVisible(false);
    if (success) {
      // Increment refresh counter to trigger the useEffect
      setRefreshReviews(prev => prev + 1);
    }
  };

  const filteredOrders = orders.filter(
    (order) => order.orderStatus === selectedTab
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "Processing": return "#FF92A5";
      case "Delivered": return "#5E9EFF";
      case "Cancelled": return "#7ED957";
      default: return "#FF92A5";
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderTitle}>{`Order #${item._id.substring(0, 8)}...`}</Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) }]}>
          <Text style={styles.statusText}>{item.orderStatus}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Products</Text>
      {item.orderItems.map((product, index) => {
        const actualProductId = product.product?._id || product.productId;
        const reviewKey = `${item._id}-${actualProductId}`;
        
        return (
          <View key={index} style={styles.productItem}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.productMetaContainer}>
                <Text style={styles.productQuantity}>{`Qty: ${product.quantity}`}</Text>
                <Text style={styles.productPrice}>{`₱${product.price.toFixed(2)}`}</Text>
              </View>
              
              {selectedTab === "Delivered" && (
                <View style={styles.reviewButtonContainer}>
                  {reviewedProducts[reviewKey] ? (
                    <TouchableOpacity
                      style={styles.reviewedButton} // New styled button for viewing review
                      onPress={() => handleViewReview(
                        actualProductId,
                        product.name,
                        product.image,
                        item._id
                      )}
                    >
                      <Ionicons name="eye" size={14} color="#FFF" />
                      <Text style={styles.reviewButtonText}>View/Edit Review</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => handleCreateReview(
                        actualProductId, 
                        product.name, 
                        product.image,
                        item._id
                      )}
                    >
                      <Ionicons name="star" size={14} color="#FFF" />
                      <Text style={styles.reviewButtonText}>Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        );
      })}

      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{`₱${item.totalPrice.toFixed(2)}`}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Method</Text>
          <Text style={styles.summaryValue}>{item.modeOfPayment}</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={64} color="#FFCDD2" />
      <Text style={styles.emptyText}>
        {userId ? "No orders found in this category." : "Please log in to view your orders."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <Text style={styles.screenTitle}>My Orders</Text>
        
        <View style={styles.tabContainer}>
          {["Processing", "Delivered", "Cancelled"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {status === "loading" ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FF92A5" />
            <Text style={styles.loadingText}>Loading your orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF92A5" />
            <Text style={styles.errorText}>
              {typeof error === "string" ? error : "Failed to load orders"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      
      <ReviewModal
        visible={reviewModalVisible}
        onClose={handleReviewComplete}
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        productImage={selectedProduct.image}
        orderId={selectedProduct.orderId}
        existingReview={existingReview}
        isEditing={isEditingReview}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  reviewedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5E9EFF', // Blue color to differentiate from the review button
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
    gap: 4,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333333",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#888888",
  },
  activeTabText: {
    color: "#FF92A5",
    fontWeight: "600",
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  orderDate: {
    fontSize: 14,
    color: "#888888",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333333",
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333333",
  },
  productMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productQuantity: {
    fontSize: 13,
    color: "#888888",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  orderSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#888888",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888888",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#FF92A5",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
  
  // Review button styles
  reviewButtonContainer: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF92A5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: "center",
  },
  reviewButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  reviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
  },
  reviewedText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        paddingBottom: 40 // Extra padding for iOS to account for home indicator
      }
    })
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333333",
  },
  productPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  reviewProductImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  reviewProductName: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "center",
  },
  starIcon: {
    marginHorizontal: 4,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333333",
  },
  commentInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#FF92A5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  }
});

export default OrdersScreen;