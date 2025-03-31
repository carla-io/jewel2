import React, { useEffect, useState } from "react";
import { 
  View, Text, TextInput, Button, Image, Alert, 
  StyleSheet, TouchableOpacity, ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, editProduct } from "../../redux/slices/productSlice";

const EditProductScreen = () => {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();

  // Updated selectors to match your Redux state structure
  const product = useSelector((state) => state.product.product);
  const loading = useSelector((state) => state.product.loading);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // Existing images
  const [newImages, setNewImages] = useState([]); // New images

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setPrice(product.price ? product.price.toString() : "");
      setDescription(product.description || "");
      setCategory(product.category || "");
      setImages(product.images || []);
    }
  }, [product]);

  const pickOrCaptureImage = () => {
    Alert.alert("Select Image", "Choose an option", [
      { text: "📷 Take a Picture", onPress: captureImage },
      { text: "🖼️ Choose from Gallery", onPress: pickImages },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewImages([...newImages, ...result.assets.map(asset => ({
        uri: asset.uri,
        name: `product_${Date.now()}.jpg`,
        type: "image/jpeg"
      }))]);
    }
  };

  const captureImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewImages([...newImages, {
        uri: result.assets[0].uri,
        name: `product_${Date.now()}.jpg`,
        type: "image/jpeg"
      }]);
    }
  };

  const handleUpdate = () => {
    // Updated to match the editProduct thunk's expected structure
    const productData = {
      name,
      price,
      description,
      category,
      newImages
    };

    dispatch(editProduct({ productId, productData }))
      .unwrap()
      .then(() => {
        Alert.alert("Success", "Product updated successfully.");
        router.back();
      })
      .catch((error) => {
        Alert.alert("Error", error || "Failed to update product.");
      });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Product</Text>

      {/* Existing Images */}
      <View style={styles.imageGallery}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img.url }} style={styles.image} />
        ))}
      </View>

      {/* New Images Preview */}
      <View style={styles.imageGallery}>
        {newImages.map((img, index) => (
          <Image key={index} source={{ uri: img.uri }} style={styles.image} />
        ))}
      </View>

      {/* Image Picker */}
      <TouchableOpacity onPress={pickOrCaptureImage} style={styles.imageContainer}>
        <Ionicons name="camera-outline" size={30} color="#000" />
        <Text>Add Images</Text>
      </TouchableOpacity>

      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Product Name" />
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Price" />
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={description} 
        onChangeText={setDescription} 
        placeholder="Description" 
        multiline 
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Category" value="" />
          <Picker.Item label="Necklaces" value="Necklaces" />
          <Picker.Item label="Earrings" value="Earrings" />
          <Picker.Item label="Bracelets" value="Bracelets" />
          <Picker.Item label="Rings" value="Rings" />
        </Picker>
      </View>

      <TouchableOpacity 
        style={styles.updateButton} 
        onPress={handleUpdate}
        disabled={loading}
      >
        <Text style={styles.updateButtonText}>
          {loading ? "Updating..." : "Update Product"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    backgroundColor: "#f8f8f8" 
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20 
  },
  imageGallery: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginBottom: 10 
  },
  imageContainer: { 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#e1e1e1",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20 
  },
  image: { 
    width: 100, 
    height: 100, 
    margin: 5, 
    borderRadius: 10 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#ddd",
    padding: 10, 
    marginBottom: 15, 
    borderRadius: 5, 
    backgroundColor: "#fff" 
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#fff"
  },
  picker: {
    height: 50
  },
  updateButton: {
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 5,
    alignItems: "center"
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});

export default EditProductScreen;