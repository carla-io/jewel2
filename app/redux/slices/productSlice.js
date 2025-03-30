import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://192.168.62.237:4000/api/product";
const SEARCH_API_URL = "http://192.168.62.237:4000/api/product/search";

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
      });
  },
});

export default productsSlice.reducer;
