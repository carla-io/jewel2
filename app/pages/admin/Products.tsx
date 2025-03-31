import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Button,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, deleteProduct } from "../../redux/slices/productSlice";

const ProductListScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get products and loading state from Redux
  const products = useSelector((state) => state.product.products);
  const loading = useSelector((state) => state.product.loading);
  const error = useSelector((state) => state.product.error);

  useEffect(() => {
    // Fetch products when component mounts
    refreshProducts();
  }, []);

  const refreshProducts = () => {
    dispatch(fetchProducts());
  };

  const handleDelete = (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          dispatch(deleteProduct(id))
            .unwrap()
            .then(() => {
              Alert.alert("Success", "Product deleted successfully.");
            })
            .catch((error) => {
              Alert.alert("Error", error || "Failed to delete product.");
            });
        },
      },
    ]);
  };

  const handleEdit = (productId) => {
    router.push({ pathname: "/pages/admin/EditProduct", params: { productId } });
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshProducts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push("/pages/admin/AddProduct")}
        >
          <Text style={styles.addButtonText}>+ Add Product</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#4285F4" />
        </View>
      )}
      
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image 
              source={{ uri: item.images?.[0]?.url || item.image || "https://via.placeholder.com/150" }} 
              style={styles.image} 
            />

            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.category}>Category: {item.category}</Text>
              <Text style={styles.price}>₱{item.price}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEdit(item._id)} style={styles.editButton}>
                <Text style={styles.actionText}>✏️ Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                <Text style={styles.actionText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshing={loading}
        onRefresh={refreshProducts}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: "#f8f8f8" 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  addButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1
  },
  row: { 
    flexDirection: "row", 
    backgroundColor: "#fff", 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 8, 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  image: { 
    width: 70, 
    height: 70, 
    borderRadius: 8, 
    marginRight: 15 
  },
  details: { 
    flex: 1 
  },
  name: { 
    fontSize: 18, 
    fontWeight: "bold",
    marginBottom: 4
  },
  category: {
    fontSize: 14,
    color: "#666"
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4285F4",
    marginVertical: 4
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 2
  },
  actions: { 
    flexDirection: "column",
    justifyContent: "space-between",
    height: 70
  },
  editButton: { 
    backgroundColor: "#4CAF50", 
    padding: 8, 
    borderRadius: 5, 
    marginBottom: 5,
    minWidth: 80,
    alignItems: "center"
  },
  deleteButton: { 
    backgroundColor: "#E53935", 
    padding: 8, 
    borderRadius: 5,
    minWidth: 80,
    alignItems: "center"
  },
  actionText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: "#666"
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666"
  },
  errorText: {
    fontSize: 16,
    color: "#E53935",
    marginBottom: 15
  },
  retryButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});

export default ProductListScreen;