import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from "react-native";
import axios from "axios";
import { CartContext } from "../context/CartContext"; // Import Cart Context

export default function Index() {
  const { addToCart } = useContext(CartContext); // Access cart context
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Necklaces", "Earrings", "Bracelets"];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://192.168.100.171:4000/api/product/get");
        if (response.data.success) {
          setProducts(response.data.products);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const filteredProducts = selectedCategory === "All" ? products : products.filter((product) => product.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
        {categories.map((category) => (
          <TouchableOpacity 
            key={category} 
            style={[styles.categoryButton, selectedCategory === category && styles.selectedCategoryButton]} 
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            
            {/* ✅ Scrollable Images */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
  {(Array.isArray(item.image) ? item.image : [item.image]).map((img, index) => (
    img ? (
      <Image key={index} source={{ uri: img }} style={styles.productImage} />
    ) : null
  ))}
</ScrollView>



            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productPrice}>₱{item.price}</Text>
            <TouchableOpacity 
              style={styles.addToCartButton} 
              onPress={() => addToCart({ ...item, id: item._id || item.id })}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  categoryScrollView: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  categoryButton: {
    width: 100,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCategoryButton: {
    backgroundColor: "#f56a79",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    margin: 10,
    flex: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  imageScrollView: {
    flexDirection: "row",
  },
  productImage: {
    width: 120, 
    height: 120,
    borderRadius: 10,
    marginHorizontal: 5, // Space between images
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  productCategory: {
    fontSize: 14,
    color: "gray",
  },
  productPrice: {
    fontSize: 16,
    color: "#28a745",
    fontWeight: "bold",
    marginVertical: 5,
  },
  addToCartButton: {
    backgroundColor: "#f56a79",
    padding: 8,
    borderRadius: 5,
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "bold",
  },
});