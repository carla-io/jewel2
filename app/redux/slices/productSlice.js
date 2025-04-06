import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://192.168.144.237:4000/api/product";
const SEARCH_API_URL = "http://192.168.144.237:4000/api/product/search";

// Async thunk for adding a product
export const addProduct = createAsyncThunk("products/addProduct", async (product, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("category", product.category);
        formData.append("price", product.price);
        formData.append("description", product.description);

        product.images.forEach((image, index) => {
            let uri = image.uri;
            let fileName = uri.split("/").pop();
            let fileType = fileName.includes(".") ? fileName.split(".").pop() : "jpg";

            formData.append("images", {
                uri: image.uri,
                name: fileName,
                type: `image/${fileType}`,
            });            
        });

        const response = await axios.post(`${API_BASE_URL}/new`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data.product;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Error adding product");
    }
});

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk("products/fetchProducts", async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/get`);
        if (response.data.success) {
            return response.data.products;
        } else {
            return rejectWithValue("Failed to fetch products");
        }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Error fetching products");
    }
});

// Async thunk for searching products
export const searchProducts = createAsyncThunk("products/searchProducts", async (query, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${SEARCH_API_URL}?q=${query}`);
        if (response.data.success) {
            return response.data.products;
        } else {
            return rejectWithValue("No products found");
        }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Error searching products");
    }
});

// Async thunk for fetching a single product
export const fetchProductById = createAsyncThunk("products/fetchProductById", async (productId, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${productId}`);
        if (response.data.success) {
            return response.data.product;
        } else {
            return rejectWithValue("Failed to fetch product details");
        }
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Error fetching product details");
    }
});

export const editProduct = createAsyncThunk(
    "products/editProduct",
    async ({ productId, productData }, { rejectWithValue }) => {
      try {
        const formData = new FormData();
        formData.append("name", productData.name);
        formData.append("price", productData.price);
        formData.append("description", productData.description);
        formData.append("category", productData.category);
  
        if (productData.newImages) {
          productData.newImages.forEach((image, index) => {
            formData.append(`newImages`, {
              uri: image.uri,
              name: `product_image_${index}.jpg`,
              type: "image/jpeg",
            });
          });
        }
  
        console.log("🔹 Sending FormData:", [...formData.entries()]);
  
        const response = await axios.put(`${API_BASE_URL}/update/${productId}`, formData, {
          headers: { "Content-Type": "multipart/form-data", "Accept": "application/json" },
        });
  
        console.log("✅ Edit Product Response:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Error editing product:", error.message);
        return rejectWithValue(error.response?.data || "Failed to update product.");
      }
    }
);

// New: Async thunk for deleting a product
export const deleteProduct = createAsyncThunk(
    "products/deleteProduct",
    async (productId, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/delete/${productId}`);
            if (response.data.success) {
                return productId;
            } else {
                return rejectWithValue("Failed to delete product");
            }
        } catch (error) {
            console.error("❌ Error deleting product:", error.message);
            return rejectWithValue(error.response?.data?.message || "Error deleting product");
        }
    }
);

const productsSlice = createSlice({
    name: "products",
    initialState: {
        products: [],
        searchResults: [],
        product: null,
        selectedVariant: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchProductById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.loading = false;
                state.product = action.payload;
                state.selectedVariant = action.payload.variants?.length > 0 ? action.payload.variants[0] : null;
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(searchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.searchResults = action.payload;
            })
            .addCase(searchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products.push(action.payload);
            })
            .addCase(addProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(editProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(editProduct.fulfilled, (state, action) => {
                state.loading = false;
                // ✅ Find and update the product in the state
                const updatedProduct = action.payload.product;
                const existingProductIndex = state.products.findIndex((p) => p._id === updatedProduct._id);
                if (existingProductIndex !== -1) {
                  state.products[existingProductIndex] = updatedProduct;
                }
            })
            .addCase(editProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // New: Handle delete product cases
            .addCase(deleteProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                // Remove the deleted product from the products array
                state.products = state.products.filter(product => product._id !== action.payload);
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default productsSlice.reducer;