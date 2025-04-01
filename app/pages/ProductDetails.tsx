import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Share,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CartContext } from "../../context/CartContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById } from "../redux/slices/productSlice";
import { fetchReview, fetchReviews } from "../redux/slices/reviewSlice";
const { width, height } = Dimensions.get("window");

export default function ProductDetails() {
  const { addToCart } = useContext(CartContext);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  // Try to get productId safely
  const productId = route.params?.productId;

  // Get product state from Redux
  const { product, loading, error } = useSelector((state) => state.product);
  
  // Get review state from Redux
  const { 
    reviews: productReviews, 
    userReview, 
    isLoading: reviewLoading 
  } = useSelector((state) => state.review);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [userId, setUserId] = useState(null);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Fetch product details from Redux
  useEffect(() => {
    if (!productId) {
      console.error("Product ID is missing from route params");
      return;
    }
    
    dispatch(fetchProductById(productId));
  }, [dispatch, productId]);

  // Set selected variant when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  useEffect(() => {
    const getUserData = async () => {
      try {
        console.log("Attempting to get user data...");
        
        // Try to get from AsyncStorage first
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log("Full user data from AsyncStorage:", parsedUser);
          
          // Check what property contains the user ID
          if (parsedUser._id) {
            console.log("Using _id:", parsedUser._id);
            setUserId(parsedUser._id);
          } else if (parsedUser.id) {
            console.log("Using id:", parsedUser.id);
            setUserId(parsedUser.id);
          } else {
            console.log("No ID found in user data, structure:", Object.keys(parsedUser));
            // Log all properties to find where the ID might be
            for (const key in parsedUser) {
              console.log(`${key}:`, parsedUser[key]);
            }
          }
          return;
        }
        
        console.log("No user in AsyncStorage, trying API...");
        // If not in AsyncStorage, fetch from API
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          console.log("No token found, cannot fetch user");
          return;
        }
        
        const response = await axios.post(
          "http://192.168.100.171:4000/api/auth/user",
          { token }
        );
        
        console.log("User data from API:", response.data.user._id);
        setUserId(response.data.user._id);
      } catch (err) {
        console.error("Failed to get user data:", err);
      }
    };
    
    getUserData();
  }, []);

  // Fetch reviews using Redux
  useEffect(() => {
    if (!loading && product && productId) {
      // Fetch all reviews for the product
      dispatch(fetchReviews(productId));
      
      // If we have a userId, fetch the user's review
      if (userId) {
        dispatch(fetchReview({ productId, userId }));
      }
    }
  }, [dispatch, productId, loading, product, userId]);

  
  
  // Animate entry
  useEffect(() => {
    if (!loading && product) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [loading, product]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const itemToAdd = {
      ...product,
      id: product._id || product.id,
      quantity: quantity,
      variant: selectedVariant
    };
    
    addToCart(itemToAdd);
    
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleShare = async () => {
    if (!product) return;
    
    try {
      await Share.share({
        message: `Check out this amazing ${product.name} - Only ₱${Number(product.price).toLocaleString()}!`,
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const toggleFavorite = () => setFavorite(prev => !prev);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#f7dada', '#f9d1d1', '#f7dada']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#e55c6c" />
          <Text style={styles.loadingText}>Loading product details...</Text>
        </LinearGradient>
      </View>
    );
  }

  // Render error state
  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#e55c6c" />
        <Text style={styles.errorText}>{error || "Product not found"}</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get valid images with proper validation
  const getValidImages = () => {
    if (!product.images || !Array.isArray(product.images)) {
      return [];
    }
    return product.images.filter(img => img && img.url && typeof img.url === 'string' && img.url.trim() !== '');
  };
  
  const validImages = getValidImages();

  return (
    <Animated.View 
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Images Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset;
              const viewSize = event.nativeEvent.layoutMeasurement;
              const pageNum = Math.floor(contentOffset.x / viewSize.width);
              setCurrentImageIndex(pageNum);
            }}
            scrollEventThrottle={16}
          >
            {validImages.length > 0 ? (
              validImages.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img.url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ))
            ) : (
              // Fallback image or placeholder when no valid images are available
              <View style={[styles.productImage, styles.noImageContainer]}>
                <Ionicons name="image-outline" size={60} color="#ccc" />
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}
          </ScrollView>
          
          {/* Image Indicator Dots */}
          {validImages.length > 1 && (
            <View style={styles.pagination}>
              {validImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentImageIndex === index && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteIconContainer} onPress={toggleFavorite}>
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={24}
              color={favorite ? "#e55c6c" : "#fff"}
            />
          </TouchableOpacity>
        </View>
        
        {/* Product Info Section */}
        <View style={styles.productInfoContainer}>
          <Text style={styles.categoryLabel}>{product.category}</Text>
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Rating Section */}
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= 4 ? "star" : "star-outline"}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>(4.0)</Text>
            <Text style={styles.reviewCount}>128 reviews</Text>
          </View>
          
          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₱{Number(product.price).toLocaleString()}</Text>
            {product.oldPrice && (
              <Text style={styles.oldPrice}>₱{Number(product.oldPrice).toLocaleString()}</Text>
            )}
          </View>
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {product.description || 
                "Exquisite handcrafted jewelry made with premium materials. This piece features delicate details and exceptional craftsmanship, perfect for special occasions or everyday elegance."}
            </Text>
          </View>
          
          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <View style={styles.variantsContainer}>
              <Text style={styles.sectionTitle}>Variants</Text>
              <View style={styles.variantOptions}>
                {product.variants.map((variant, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.variantButton,
                      selectedVariant === variant && styles.selectedVariantButton
                    ]}
                    onPress={() => setSelectedVariant(variant)}
                  >
                    <Text 
                      style={[
                        styles.variantText,
                        selectedVariant === variant && styles.selectedVariantText
                      ]}
                    >
                      {variant}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {/* Materials & Dimensions */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="diamond-outline" size={18} color="#888" />
              <Text style={styles.detailLabel}>Materials</Text>
              <Text style={styles.detailValue}>{product.materials || "Sterling Silver, 18K Gold"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={18} color="#888" />
              <Text style={styles.detailLabel}>Dimensions</Text>
              <Text style={styles.detailValue}>{product.dimensions || "16 inch chain"}</Text>
            </View>
          </View>
          
          {/* Reviews Section */}
          <View style={styles.reviewsContainer}>
  <Text style={styles.sectionTitle}>Reviews</Text>
  
  {reviewLoading ? (
    <ActivityIndicator size="small" color="#e55c6c" />
  ) : productReviews.length > 0 ? (
    <>
      {/* Display user's own review if it exists */}
      {userReview && (
        <View style={styles.userReviewContainer}>
          <Text style={styles.userReviewLabel}>Your Review</Text>
          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <Image
                  source={{ uri: userReview.userImage || 'https://via.placeholder.com/40' }}
                  style={styles.reviewerImage}
                />
                <View>
                  <Text style={styles.reviewerName}>You</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(userReview.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= userReview.rating ? "star" : "star-outline"}
                    size={14}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewText}>{userReview.comment}</Text>
          </View>
        </View>
      )}
      
      {/* Other reviews list - limited to 3 for space */}
      {productReviews.slice(0, 3).map((review) => (
        <View key={review._id} style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              <Image
                source={{ uri: review.userImage || 'https://via.placeholder.com/40' }}
                style={styles.reviewerImage}
              />
              <View>
                <Text style={styles.reviewerName}>{review.userName}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= review.rating ? "star" : "star-outline"}
                  size={14}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewText}>{review.comment}</Text>
        </View>
      ))}
      
      {/* View all reviews button */}
      {productReviews.length > 3 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllReviews', { productId, productName: product.name })}
        >
          <Text style={styles.viewAllText}>View all {productReviews.length} reviews</Text>
          <Ionicons name="chevron-forward" size={16} color="#e55c6c" />
        </TouchableOpacity>
      )}
    </>
  ) : (
    <View style={styles.noReviewsContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={40} color="#ccc" />
      <Text style={styles.noReviewsText}>No reviews yet</Text>
      <TouchableOpacity 
        style={styles.writeReviewButton}
        onPress={() => navigation.navigate('WriteReview', { productId, productName: product.name })}
      >
        <Text style={styles.writeReviewText}>Write the first review</Text>
      </TouchableOpacity>
    </View>
  )}
</View>
</View>
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton} 
            onPress={increaseQuantity}
          >
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        
        <Animated.View 
          style={[
            { transform: [{ scale: buttonScale }] },
            { flex: 1 }
          ]}
        >
          <TouchableOpacity 
            style={styles.addToCartButton} 
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#e55c6c', '#f56a79']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addToCartGradient}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: '#e55c6c',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20
  },
  goBackButton: {
    backgroundColor: '#e55c6c',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  shareButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  imageContainer: {
    height: height * 0.45,
    position: 'relative'
  },
  productImage: {
    width,
    height: height * 0.45
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9'
  },
  noImageText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center'
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4
  },
  paginationDotActive: {
    backgroundColor: '#fff'
  },
  favoriteIconContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8
  },
  productInfoContainer: {
    padding: 20
  },
  categoryLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  stars: {
    flexDirection: 'row'
  },
  ratingText: {
    marginLeft: 5,
    color: '#333',
    fontSize: 14
  },
  reviewCount: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e55c6c'
  },
  oldPrice: {
    fontSize: 18,
    color: '#888',
    textDecorationLine: 'line-through',
    marginLeft: 10
  },
  descriptionContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555'
  },
  variantsContainer: {
    marginBottom: 20
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  variantButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10
  },
  selectedVariantButton: {
    borderColor: '#e55c6c',
    backgroundColor: 'rgba(229, 92, 108, 0.1)'
  },
  variantText: {
    fontSize: 14,
    color: '#666'
  },
  selectedVariantText: {
    color: '#e55c6c',
    fontWeight: '600'
  },
  detailsContainer: {
    marginBottom: 20
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
    width: 80
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  similarProductsContainer: {
    marginBottom: 20
  },
  similarProductCard: {
    width: 140,
    marginRight: 15
  },
  similarProductImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#f0f0f0'
  },
  similarProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8
  },
  similarProductPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e55c6c',
    marginTop: 4
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    marginRight: 15
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 30,
    textAlign: 'center'
  },
  addToCartButton: {
    flex: 1,
    height: 45,
    borderRadius: 25,
    overflow: 'hidden'
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  // Add these to your styles object
reviewsContainer: {
  marginTop: 20,
  paddingBottom: 20,
},
reviewItem: {
  backgroundColor: '#f8f8f8',
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
},
reviewHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},
reviewerInfo: {
  flexDirection: 'row',
  alignItems: 'center',
},
reviewerImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 10,
},
reviewerName: {
  fontWeight: '600',
  fontSize: 14,
  color: '#333',
},
reviewDate: {
  fontSize: 12,
  color: '#888',
  marginTop: 2,
},
reviewText: {
  fontSize: 14,
  lineHeight: 20,
  color: '#444',
  marginTop: 6,
},
userReviewContainer: {
  marginBottom: 16,
},
userReviewLabel: {
  fontSize: 15,
  fontWeight: '600',
  marginBottom: 6,
  color: '#555',
},
noReviewsContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 30,
},
noReviewsText: {
  marginTop: 10,
  fontSize: 16,
  color: '#888',
},
writeReviewButton: {
  marginTop: 16,
  paddingVertical: 10,
  paddingHorizontal: 20,
  backgroundColor: '#f8f8f8',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e55c6c',
},
writeReviewText: {
  color: '#e55c6c',
  fontWeight: '600',
  fontSize: 14,
},
viewAllButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 12,
  paddingVertical: 10,
},
viewAllText: {
  color: '#e55c6c',
  fontWeight: '600',
  fontSize: 14,
  marginRight: 4,
},
});