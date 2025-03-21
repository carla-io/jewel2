import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function UserProfile() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState("Add a short bio to tell people about yourself");
  const [editingBio, setEditingBio] = useState(false);
  const [theme, setTheme] = useState("light");
  const navigation = useNavigation();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [newProfilePicture, setNewProfilePicture] = useState<any>(null);
  const [achievements, setAchievements] = useState([
    { id: 1, name: "Profile Created", icon: "trophy", unlocked: true },
    { id: 2, name: "First Post", icon: "pencil", unlocked: false },
    { id: 3, name: "10 Friends", icon: "users", unlocked: false },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "SignupScreen" }] });
          return;
        }

        const response = await axios.post(
          "http://192.168.100.171:4000/api/auth/user",
          { token }
        );

        setUserName(response.data.user.username);
        setUserEmail(response.data.user.email);
        setProfileImage(response.data.user.profilePicture?.url || null);
        setUserId(response.data.user._id);
        setBio(response.data.user.bio || "Add a short bio to tell people about yourself");
      } catch (err) {
        Toast.show({ type: "error", text1: "Error", text2: "Failed to fetch user data" });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const pickOrCaptureImage = () => {
    Alert.alert("Select Image", "Choose an option", [
      { text: "📷 Take a Picture", onPress: captureImage },
      { text: "🖼️ Choose from Gallery", onPress: pickImage },
      { text: "🎨 Apply Filter", onPress: showFilterOptions },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showFilterOptions = () => {
    if (!profileImage) {
      Alert.alert("No Image", "Please select an image first");
      return;
    }
    
    Alert.alert("Apply Filter", "Choose a filter to apply", [
      { text: "Vintage", onPress: () => applyFilter("vintage") },
      { text: "Black & White", onPress: () => applyFilter("bw") },
      { text: "Sepia", onPress: () => applyFilter("sepia") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const applyFilter = (filterType: string) => {
    // This would normally call an API to apply a filter
    // For now we'll just show a toast message
    Toast.show({
      type: "success",
      text1: "Filter Applied",
      text2: `${filterType} filter has been applied!`,
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await handleImageResult(result.assets[0].uri);
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await handleImageResult(result.assets[0].uri);
    }
  };

  const handleImageResult = async (uri: string) => {
    const fileType = uri.split(".").pop() || "jpeg";
    const fileName = `profile.${fileType}`;

    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      Alert.alert("Error", "Image file does not exist.");
      return;
    }

    setProfileImage(uri);
    setNewProfilePicture({
      uri: fileInfo.uri,
      name: fileName,
      type: `image/${fileType}`,
    });
  };

  const handleUpdateProfile = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Toast.show({ type: "error", text1: "Error", text2: "No authentication token found." });
      return;
    }

    if (!userId) {
      Toast.show({ type: "error", text1: "Error", text2: "User ID not found." });
      return;
    }

    const formData = new FormData();
    formData.append("username", userName);
    formData.append("email", userEmail);
    formData.append("bio", bio);
    formData.append("theme", theme);

    if (newProfilePicture) {
      const localUri = newProfilePicture.uri;
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const fileType = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("profilePicture", {
        uri: localUri,
        name: filename || "profile.jpg",
        type: fileType,
      });
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `http://192.168.100.171:4000/api/auth/update-profile/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfileImage(`${response.data.user.profilePicture?.url}?t=${Date.now()}`);
      Toast.show({ 
        type: "success", 
        text1: "Profile Updated!", 
        text2: "Looking good! Your profile has been refreshed." 
      });
      
      // Unlock an achievement for updating profile
      const newAchievements = [...achievements];
      if (!newAchievements[1].unlocked) {
        newAchievements[1].unlocked = true;
        setAchievements(newAchievements);
        setTimeout(() => {
          Toast.show({
            type: "info",
            text1: "Achievement Unlocked!",
            text2: "First Profile Update",
            position: "bottom",
          });
        }, 1000);
      }
    } catch (err) {
      console.error("❌ Error during user profile update:", err.response?.data || err.message);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          onPress: async () => {
            setLoading(true);
            setTimeout(async () => {
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("token");
              setLoading(false);
              router.push("/pages/SignUpScreen");
            }, 800);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, theme === "dark" && styles.darkContainer]}>
        <LinearGradient 
          colors={theme === "dark" ? ['#1a1a2e', '#16213e'] : ['#f8f9fa', '#e9ecef']} 
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#f56a79" />
          <Text style={[styles.loadingText, theme === "dark" && styles.darkText]}>
            Loading your amazing profile...
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.scrollView, theme === "dark" && styles.darkScrollView]}
      contentContainerStyle={styles.scrollViewContent}
    >
      <LinearGradient
        colors={theme === "dark" ? ['#1a1a2e', '#16213e'] : ['#f8f9fa', '#e9ecef']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Ionicons name={theme === "dark" ? "sunny" : "moon"} size={24} color={theme === "dark" ? "#fff" : "#333"} />
        </TouchableOpacity>
      </LinearGradient>
      
      <View style={[styles.profileSection, theme === "dark" && styles.darkProfileSection]}>
        <TouchableOpacity onPress={pickOrCaptureImage}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: profileImage || "https://www.example.com/default-avatar.png",
              }}
              style={styles.profileImage}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
              style={styles.imageForeground}
            >
              <Ionicons name="camera" size={28} color="#fff" style={styles.cameraIcon} />
            </LinearGradient>
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.nameText, theme === "dark" && styles.darkText]}>
          {userName || "Your Name"}
        </Text>
        <Text style={[styles.emailText, theme === "dark" && styles.darkEmailText]}>
          {userEmail || "your.email@example.com"}
        </Text>
        
        <TouchableOpacity onPress={() => setEditingBio(true)}>
          <View style={styles.bioContainer}>
            {editingBio ? (
              <TextInput
                style={[styles.bioInput, theme === "dark" && styles.darkBioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Write something about yourself..."
                multiline
                placeholderTextColor={theme === "dark" ? "#aaa" : "#999"}
                onBlur={() => setEditingBio(false)}
                autoFocus
              />
            ) : (
              <Text style={[styles.bioText, theme === "dark" && styles.darkText]}>
                {bio}
                <Text style={styles.editBioText}> (tap to edit)</Text>
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.infoSection, theme === "dark" && styles.darkInfoSection]}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>
          Personal Information
        </Text>
        
        <View style={styles.inputGroup}>
          <Ionicons name="person" size={22} color={theme === "dark" ? "#f56a79" : "#f56a79"} />
          <TextInput
            style={[styles.input, theme === "dark" && styles.darkInput]}
            value={userName}
            onChangeText={setUserName}
            placeholder="Enter your name"
            placeholderTextColor={theme === "dark" ? "#aaa" : "#999"}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Ionicons name="mail" size={22} color={theme === "dark" ? "#f56a79" : "#f56a79"} />
          <TextInput
            style={[styles.input, theme === "dark" && styles.darkInput]}
            value={userEmail}
            onChangeText={setUserEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            placeholderTextColor={theme === "dark" ? "#aaa" : "#999"}
          />
        </View>
      </View>
      
      <View style={[styles.achievementsSection, theme === "dark" && styles.darkInfoSection]}>
        <Text style={[styles.sectionTitle, theme === "dark" && styles.darkText]}>
          Achievements
        </Text>
        
        <View style={styles.achievementsContainer}>
          {achievements.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[
                styles.achievementItem, 
                theme === "dark" && styles.darkAchievementItem,
                !achievement.unlocked && styles.lockedAchievement
              ]}
            >
              <FontAwesome5 
                name={achievement.icon} 
                size={24} 
                color={achievement.unlocked ? "#f56a79" : theme === "dark" ? "#444" : "#ccc"} 
              />
              <Text style={[
                styles.achievementText, 
                theme === "dark" && styles.darkText,
                !achievement.unlocked && styles.lockedAchievementText
              ]}>
                {achievement.name}
              </Text>
              {achievement.unlocked ? (
                <Ionicons name="checkmark-circle" size={16} color="#4CD964" style={styles.achievementIcon} />
              ) : (
                <Ionicons name="lock-closed" size={16} color={theme === "dark" ? "#555" : "#ccc"} style={styles.achievementIcon} />
              )}
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.updateButton, { opacity: loading ? 0.7 : 1 }]} 
          onPress={handleUpdateProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.updateButtonText}>Save Profile</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#333" style={styles.buttonIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <Toast />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  darkScrollView: {
    backgroundColor: "#121212",
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
  },
  header: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  themeToggle: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  profileSection: {
    alignItems: "center",
    paddingBottom: 20,
    marginTop: -60,
  },
  darkProfileSection: {
    backgroundColor: "transparent",
  },
  imageContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  imageForeground: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: "#777",
    marginBottom: 15,
  },
  darkEmailText: {
    color: "#aaa",
  },
  bioContainer: {
    width: width * 0.85,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  bioInput: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    padding: 0,
  },
  darkBioInput: {
    color: "#eee",
  },
  editBioText: {
    fontSize: 13,
    color: "#999",
    fontStyle: "italic",
  },
  infoSection: {
    width: width * 0.9,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  darkInfoSection: {
    backgroundColor: "#1e1e1e",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  darkInput: {
    color: "#eee",
  },
  darkText: {
    color: "#eee",
  },
  darkBioInput: {
    color: "#eee",
    backgroundColor: "#1e1e1e",
  },
  achievementsSection: {
    width: width * 0.9,
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  achievementsContainer: {
    marginTop: 5,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 10,
  },
  darkAchievementItem: {
    backgroundColor: "#2a2a2a",
  },
  lockedAchievement: {
    opacity: 0.7,
  },
  achievementText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  lockedAchievementText: {
    color: "#999",
  },
  achievementIcon: {
    marginLeft: 10,
  },
  buttonContainer: {
    width: width * 0.9,
    alignSelf: "center",
    marginTop: 10,
  },
  updateButton: {
    flexDirection: "row",
    backgroundColor: "#f56a79",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#f56a79",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#eee",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
});