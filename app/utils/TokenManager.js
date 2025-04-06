// First, create the TokenManager.js file in your project:
// src/utils/TokenManager.js
import * as SecureStore from 'expo-secure-store';

// Keys for storing tokens and user data
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user';

/**
 * Stores the authentication token securely
 * @param {string} token - JWT token to store
 * @returns {Promise<void>}
 */
export const storeToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

/**
 * Retrieves the stored authentication token
 * @returns {Promise<string|null>} The stored token or null if not found
 */
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Stores a refresh token securely
 * @param {string} refreshToken - Refresh token to store
 * @returns {Promise<void>}
 */
export const storeRefreshToken = async (refreshToken) => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error storing refresh token:', error);
    throw error;
  }
};

/**
 * Retrieves the stored refresh token
 * @returns {Promise<string|null>} The stored refresh token or null if not found
 */
export const getRefreshToken = async () => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
};

/**
 * Stores user data securely
 * @param {Object} userData - User data object to store
 * @returns {Promise<void>}
 */
export const storeUserData = async (userData) => {
  try {
    const userDataString = JSON.stringify(userData);
    await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

/**
 * Retrieves the stored user data
 * @returns {Promise<Object|null>} The stored user data object or null if not found
 */
export const getUserData = async () => {
  try {
    const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

/**
 * Checks if the user is authenticated by verifying if a token exists
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};

/**
 * Clears all authentication data (logout)
 * @returns {Promise<void>}
 */
export const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Stores all authentication data at once
 * @param {Object} authData - Object containing token, refreshToken, and userData
 * @returns {Promise<void>}
 */
export const storeAuthData = async ({ token, refreshToken, userData }) => {
  try {
    const promises = [];
    
    if (token) {
      promises.push(storeToken(token));
    }
    
    if (refreshToken) {
      promises.push(storeRefreshToken(refreshToken));
    }
    
    if (userData) {
      promises.push(storeUserData(userData));
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw error;
  }
};