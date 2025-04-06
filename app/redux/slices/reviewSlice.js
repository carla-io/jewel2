import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getToken } from "../../utils/TokenManager"; // Import the getToken function

const apiUrl = "http://192.168.144.237:4000";

// Fetch a single review
export const fetchReview = createAsyncThunk("reviews/fetchReview", async ({ productId, userId }, { rejectWithValue }) => {
  try {
    const token = await getToken();
    if (!token) return rejectWithValue("No token found");

    const response = await axios.get(`${apiUrl}/api/reviews/getSingle/${productId}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.review;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to fetch review");
  }
});

// Fetch all reviews for a product
export const fetchReviews = createAsyncThunk("reviews/fetchReviews", async (productId, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${apiUrl}/api/reviews/get?productId=${productId}`);
    return response.data.reviews;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to fetch reviews");
  }
});

// Submit or update a review
export const submitReview = createAsyncThunk("reviews/submitReview", async ({ reviewData, isEditing }, { rejectWithValue }) => {
  try {
    const token = await getToken();
    if (!token) return rejectWithValue("No token found");

    const endpoint = isEditing ? `${apiUrl}/api/reviews/update` : `${apiUrl}/api/reviews/add`;
    const method = isEditing ? "put" : "post";

    const response = await axios({
      method,
      url: endpoint,
      data: reviewData,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Failed to submit review");
  }
});

// Check if a product has been reviewed by the user
export const hasBeenReviewed = createAsyncThunk("reviews/hasBeenReviewed", async ({ productId, userId }, { rejectWithValue }) => {
  try {
    const token = await getToken();
    if (!token) return false;

    const response = await axios.get(`${apiUrl}/api/reviews/getSingle/${productId}/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.success;
  } catch (error) {
    return false;
  }
});

const reviewSlice = createSlice({
  name: "reviews",
  initialState: {
    reviews: [],
    userReview: null,
    isLoading: false,
    error: null,
    hasReviewed: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userReview = action.payload;
      })
      .addCase(fetchReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.userReview = action.payload;
      })
      .addCase(hasBeenReviewed.fulfilled, (state, action) => {
        state.hasReviewed = action.payload;
      });
  },
});

export default reviewSlice.reducer;