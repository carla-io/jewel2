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
  FlatList,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CartContext } from "../../context/CartContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";

const { width, height } = Dimensions.get("window");

export default function ProductDetails() {
  const { addToCart } = useContext(CartContext);
  const navigation = useNavigation();
  const route = useRoute();
  
  // Try to get productId safely
  const productId = route.params?.productId;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedToCartItems, setAddedToCartItems] = useState({});
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Similar products (would be populated from API in real implementation)
  const similarProducts = [
    { id: 1, name: "Pearl Necklace", price: 5500, image: "https://example.com/pearl-necklace.jpg", category: "Necklaces" },
    { id: 2, name: "Silver Earrings", price: 2800, image: "https://example.com/silver-earrings.jpg", category: "Earrings" },
    { id: 3, name: "Gold Bracelet", price: 6200, image: "https://example.com/gold-bracelet.jpg", category: "Bracelets" },
    { id: 4, name: "Diamond Ring", price: 12000, image: "https://example.com/diamond-ring.jpg", category: "Rings" }
  ];

  // Fetch product details from API
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // Make sure productId exists and is valid
        if (!productId) {
          console.error("Product ID is missing from route params");
          setError("Product ID is missing");
          setLoading(false);
          return;
        }
        
        // Make the API request with the correct URL format
        const response = await axios.get(`http://192.168.100.171:4000/api/product/${productId}`);
        
        if (response.data.success) {
          setProduct(response.data.product);
          if (response.data.product.variants && response.data.product.variants.length > 0) {
            setSelectedVariant(response.data.product.variants[0]);
          }
        } else {
          setError("Failed to load product details");
        }
      } catch (error) {
        console.error("Error fetching product details:", error.response || error);
        setError("Error loading product. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProductDetails();
  }, [productId]);

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
          
          {/* You May Also Like Section */}
          <View style={styles.similarProductsContainer}>
            <Text style={styles.sectionTitle}>You May Also Like</Text>
            <FlatList
              data={similarProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.similarProductCard}>
                  <Image
                    source={{ uri: item.image }} // Use the direct image prop from our static data
                    style={styles.similarProductImage}
                    resizeMode="cover"
                    defaultSource={require('../../assets/images/adaptive-icon.png')} // Add a default image in your assets
                  />
                  <Text style={styles.similarProductName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.similarProductPrice}>₱{Number(item.price).toLocaleString()}</Text>
                </TouchableOpacity>
              )}
            />
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
    backgroundColor: '#fff'
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
  }
});