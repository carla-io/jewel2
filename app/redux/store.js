import { configureStore } from "@reduxjs/toolkit";
import orderReducer from "./slices/orderSlice";
import productReducer from "./slices/productSlice";
import reviewReducer from "./slices/reviewSlice";

export const store = configureStore({
  reducer: {
    order: orderReducer,
    product: productReducer,
    review: reviewReducer,
  },
});

// Load user from AsyncStorage when app starts
// store.dispatch(initializeUser());

export default store;
