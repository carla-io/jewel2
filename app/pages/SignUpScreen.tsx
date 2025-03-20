import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState({ username: "", email: "", password: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Camera roll permissions are required!");
      }
    };
    requestPermissions();

    // Check if user is already logged in
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
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const baseUrl = "http://192.168.100.171:4000/api/auth";
      const url = isRegistering ? `${baseUrl}/register` : `${baseUrl}/login`;
  
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
  
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
      await AsyncStorage.setItem("token", response.data.token);
  
      Alert.alert("Success", isRegistering ? "Registration successful!" : "Login successful!");
  
      if (response.data.user.role === "admin") {
        router.replace("/pages/admin/AdminDashboard");
      } else {
        router.replace("/pages/UserProfile");
      }
    } catch (error) {
      console.error("Error:", error.response?.data);
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateForm = () => {
    if (isRegistering && !user.username.trim()) {
      setError("Username is required");
      return false;
    }
    
    if (!user.email.trim()) {
      setError("Email is required");
      return false;
    }
    
    if (!user.password.trim()) {
      setError("Password is required");
      return false;
    }
    
    if (user.password.trim().length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    return true;
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Simple implementation without OAuth - replace this with your actual Google login logic
      Alert.alert(
        "Google Login Simulation", 
        "In a real app, this would connect to the Google API. For now, we're simulating a successful login.",
        [
          {
            text: "Proceed",
            onPress: async () => {
              // Simulate successful login
              const mockUser = {
                id: "google_123456",
                username: "Google User",
                email: "google.user@example.com",
                role: "user"
              };
              
              await AsyncStorage.setItem("user", JSON.stringify(mockUser));
              await AsyncStorage.setItem("token", "mock_google_token");
              
              router.replace("/pages/UserProfile");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Google Login Error:", error);
      setError("Failed to login with Google");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      
      // Simple implementation without OAuth - replace this with your actual Facebook login logic
      Alert.alert(
        "Facebook Login Simulation", 
        "In a real app, this would connect to the Facebook API. For now, we're simulating a successful login.",
        [
          {
            text: "Proceed",
            onPress: async () => {
              // Simulate successful login
              const mockUser = {
                id: "fb_123456",
                username: "Facebook User",
                email: "facebook.user@example.com",
                role: "user"
              };
              
              await AsyncStorage.setItem("user", JSON.stringify(mockUser));
              await AsyncStorage.setItem("token", "mock_facebook_token");
              
              router.replace("/pages/UserProfile");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Facebook Login Error:", error);
      setError("Failed to login with Facebook");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          

          <Text style={styles.title}>{isRegistering ? "Create Account" : "Welcome Back"}</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? "Sign up to get started" : "Sign in to continue"}
          </Text>

          {isRegistering && (
            <>

<TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.imageUploadContainer}>
                    <Ionicons name="camera-outline" size={30} color="#FF6B9B" />
                    <Text style={styles.imagePlaceholder}>Add profile photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#FF6B9B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  value={user.username}
                  onChangeText={(text) => setUser({ ...user, username: text })}
                  placeholderTextColor="#B3B3B3"
                />
              </View>

             
            </>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#FF6B9B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={user.email}
              onChangeText={(text) => setUser({ ...user, email: text })}
              placeholderTextColor="#B3B3B3"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#FF6B9B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={user.password}
              onChangeText={(text) => setUser({ ...user, password: text })}
              placeholderTextColor="#B3B3B3"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading 
                ? "Please wait..." 
                : isRegistering 
                  ? "Create Account" 
                  : "Sign In"
              }
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.socialButton} 
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <View style={styles.socialButtonContent}>
              <View style={styles.socialIconContainer}>
                <Text style={styles.socialIconText}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, styles.facebookButton]} 
            onPress={handleFacebookLogin}
            disabled={isLoading}
          >
            <View style={styles.socialButtonContent}>
              <View style={[styles.socialIconContainer, styles.facebookIconContainer]}>
                <Text style={styles.socialIconText}>f</Text>
              </View>
              <Text style={styles.socialButtonText}>Continue with Facebook</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setIsRegistering(!isRegistering)}
            style={styles.toggleContainer}
          >
            <Text style={styles.toggleText}>
              {isRegistering 
                ? "Already have an account? " 
                : "Don't have an account? "
              }
              <Text style={styles.toggleTextHighlight}>
                {isRegistering ? "Sign In" : "Sign Up"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FF6B9B",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#FFCCE0",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: "white",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: 56,
  },
  imagePicker: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FF6B9B",
  },
  imageUploadContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF9FB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFCCE0",
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    fontSize: 14,
    color: "#FF6B9B",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#FF6B9B",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#FF6B9B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#FFADC6",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#FFCCE0",
  },
  dividerText: {
    paddingHorizontal: 10,
    color: "#FF6B9B",
    fontSize: 14,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: "#FFCCE0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  facebookButton: {
    marginBottom: 30,
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DB4437",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  facebookIconContainer: {
    backgroundColor: "#1877F2",
  },
  socialIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  socialButtonText: {
    fontSize: 16,
    color: "#333",
  },
  error: {
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
  },
  toggleContainer: {
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 14,
    color: "#666",
  },
  toggleTextHighlight: {
    color: "#FF6B9B",
    fontWeight: "bold",
  },
});