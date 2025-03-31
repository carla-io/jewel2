import React, { useState } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Image,
    Button,
    StyleSheet,
    Alert,
    Text,
    Platform,
    ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";
import { useDispatch, useSelector } from "react-redux";
import { addProduct } from "../../redux/slices/productSlice";

export default function AddProductScreen({ navigation }) {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.product);
    
    const [product, setProduct] = useState({
        name: "",
        category: "Necklaces",
        price: "",
        description: "",
        images: [],
    });

    const categories = ["Necklaces", "Earrings", "Bracelets", "Rings"];

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "You need to allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setProduct((prev) => ({
                ...prev,
                images: [...prev.images, ...result.assets],
            }));
        } else {
            Alert.alert("No image selected!");
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
            quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setProduct((prev) => ({
                ...prev,
                images: [...prev.images, ...result.assets],
            }));
        } else {
            Alert.alert("No image captured!");
        }
    };

    const selectImage = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                { text: "📷 Take a Picture", onPress: captureImage },
                { text: "🖼️ Choose from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const handleAddProduct = async () => {
        if (!product.name || !product.category || !product.price || !product.description) {
            Alert.alert("Error", "All fields are required!");
            return;
        }

        if (product.images.length === 0) {
            Alert.alert("Error", "Please select at least one image!");
            return;
        }

        dispatch(addProduct(product)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                Alert.alert("Success!", "Product added successfully.");
                setProduct({ name: "", category: "Necklaces", price: "", description: "", images: [] });
                navigation.goBack();
            } else {
                Alert.alert("Error", result.payload || "Failed to add product.");
            }
        });
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Product Name"
                value={product.name}
                onChangeText={(text) => setProduct({ ...product, name: text })}
            />

            <RNPickerSelect
                onValueChange={(value) => setProduct({ ...product, category: value })}
                items={categories.map((cat) => ({ label: cat, value: cat }))}
                style={{
                    inputIOS: styles.input,
                    inputAndroid: styles.input,
                }}
                placeholder={{ label: "Select a category", value: null }}
                value={product.category}
            />

            <TextInput
                style={styles.input}
                placeholder="Price"
                keyboardType="numeric"
                value={product.price}
                onChangeText={(text) => setProduct({ ...product, price: text })}
            />

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                multiline
                value={product.description}
                onChangeText={(text) => setProduct({ ...product, description: text })}
            />

            <TouchableOpacity style={styles.imagePicker} onPress={selectImage}>
                <Text>Select Image</Text>
            </TouchableOpacity>

            {product.images.map((img, index) => (
                <Image key={index} source={{ uri: img.uri }} style={styles.imagePreview} />
            ))}

            <Button title={loading ? "Adding..." : "Add Product"} onPress={handleAddProduct} disabled={loading} />
            {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, justifyContent: "center" },
    input: { borderWidth: 1, borderColor: "#ddd", padding: 10, marginBottom: 10, borderRadius: 5 },
    textArea: { height: 100, textAlignVertical: "top" },
    imagePicker: { padding: 10, backgroundColor: "#ddd", alignItems: "center", marginBottom: 10 },
    imagePreview: { width: 100, height: 100, alignSelf: "center", marginBottom: 10, borderRadius: 10 },
});
