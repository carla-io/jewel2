import { Slot } from "expo-router";
import { View, StyleSheet } from "react-native";
import Navbar from "../components/navbar";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { UserProvider } from "../context/UserContext";
import { CartProvider } from "../context/CartContext";

export default function Layout() {
  return (
    <Provider store={store}>
      <UserProvider>
        <CartProvider>
          <View style={styles.container}>
            <Navbar isUpperNavbar={true} />  {/* Upper Navbar with hamburger menu */}
            <Navbar isSidebar={true} />  {/* New sidebar navigation */}
            <View style={styles.content}>
              <Slot />
            </View>
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
  content: {
    flex: 1,
  },
});