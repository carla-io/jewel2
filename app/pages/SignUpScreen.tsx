import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = "740216799410-uojjhmbufqumhisp275enpcdvlmbh1jt.apps.googleusercontent.com";
const FACEBOOK_APP_ID = "1364898534515169";

export default function SignUpScreen() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState({ username: "", email: "", password: "" });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const navigation = useNavigation();

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: makeRedirectUri({ useProxy: true }),
      scopes: ["profile", "email"],
      responseType: "token",
    },
    { authorizationEndpoint: "https://accounts.google.com/o/oauth2/auth" }
  );

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleAuth(response.params.access_token);
    }
  }, [response]);


  useEffect(() => {
    
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Camera roll permissions are required!");
      }
    };
    requestPermissions();

    // ✅ Check if user is already logged in
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === "admin") {
          router.replace("/pages/admin/AdminDashboard");
        } else {
          router.replace("/pages/UserProfile");
        }
      }
    } catch (error) {
      console.error("Error checking logged-in user:", error);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      } else {
        console.log("No image selected");
      }
    } catch (error) {
      console.error("Image selection error:", error);
    }
  };

  const handleSubmit = async () => {
    console.log("Sending data:", user.email, user.password); // Debugging
  
    try {
      const url = isRegistering
        ? "http://192.168.100.171:4000/api/auth/register"
        : "http://192.168.100.171:4000/api/auth/login";
  
      let requestData;
  
      if (isRegistering) {
        const formData = new FormData();
        formData.append("username", user.username);
        formData.append("email", user.email);
        formData.append("password", user.password);
  
        if (profileImage) {
          formData.append("profilePicture", {
            uri: profileImage,
            name: "profile.jpg",
            type: "image/jpeg",
          });
        }
  
        requestData = formData;
      } else {
        requestData = { email: user.email, password: user.password };
      }
  
      const response = await axios.post(url, requestData, {
        headers: {
          "Content-Type": isRegistering ? "multipart/form-data" : "application/json",
        },
      });
  
      console.log("Response:", response.data);
  
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      await AsyncStorage.setItem("token", response.data.token);
  
      Alert.alert("Success", isRegistering ? "Registration successful!" : "Login successful!");
  
      if (!isRegistering) {
        if (response.data.user.role === "admin") {
          router.replace("/pages/admin/AdminDashboard");
        } else {
          router.replace("/pages/UserProfile");
        }
      }
    } catch (error) {
      console.error("Error:", error.response?.data);
      setError(error.response?.data?.message || "Something went wrong");
    }
  };
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert("Logged out", "You have been successfully logged out!");
      router.replace("/pages/SignUpScreen"); // Redirect to login screen
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

   const handleGoogleAuth = async (accessToken) => {
    try {
      const res = await axios.post("http://192.168.100.171:4000/api/auth/google", { access_token: accessToken });
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
      await AsyncStorage.setItem("token", res.data.token);
      router.replace("/pages/UserProfile");
    } catch (error) {
      console.error("Google Auth Error:", error);
    }
  };
  
  

  const handleFacebookLogin = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri();
      const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&response_type=token&scope=email,public_profile`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === "success") {
        const response = await axios.post("http://192.168.100.171:4000/api/auth/facebook", {
          access_token: result.params.access_token,
        });

        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        await AsyncStorage.setItem("token", response.data.token);
        router.replace("/pages/UserProfile");
      }
    } catch (error) {
      console.error("Facebook Login Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? "Sign Up" : "Login"}</Text>
      {isRegistering && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={user.username}
            onChangeText={(text) => setUser({ ...user, username: text })}
          />
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={styles.imagePlaceholder}>Choose Profile Picture</Text>
            )}
          </TouchableOpacity>
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={user.email}
        onChangeText={(text) => setUser({ ...user, email: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={user.password}
        onChangeText={(text) => setUser({ ...user, password: text })}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isRegistering ? "Sign Up" : "Login"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}><Text style={styles.buttonText}>Sign in with Google</Text></TouchableOpacity>

      {/* Facebook Login Button */}
      <TouchableOpacity style={styles.facebookButton} onPress={handleFacebookLogin}>
        <Text style={styles.buttonText}>Sign in with Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.toggleText}>
          {isRegistering ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  imagePicker: {
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#f56a79",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 16,
    color: "#f56a79",
    textAlign: "center",
    marginTop: 15,
  },
  googleButton: {
    backgroundColor: "#DB4437",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  facebookButton: {
    backgroundColor: "#1877F2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
});