import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import Navbar from "../components/navbar";
import { Provider } from "react-redux";
import { store } from "./redux/store"; // ✅ Import Redux store
import { UserProvider } from "../context/UserContext";
import { CartProvider } from "../context/CartContext";

export default function Layout() {
  return (
    <Provider store={store}>  {/* ✅ Wrap everything with Redux Provider */}
      <UserProvider>
        <CartProvider>
          <View style={styles.container}>
            <Navbar isUpperNavbar />  {/* ✅ Always show Upper Navbar */}
            <Slot />
            <Navbar isLowerNavbar />  {/* ✅ Always show Lower Navbar */}
          </View>
        </CartProvider>
      </UserProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
