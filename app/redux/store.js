import { configureStore } from "@reduxjs/toolkit";
import orderReducer from "./slices/orderSlice";
import productReducer from "./slices/productSlice";

export const store = configureStore({
  reducer: {
    order: orderReducer,
    product: productReducer,
  },
});

// Load user from AsyncStorage when app starts
// store.dispatch(initializeUser());

export default store;
