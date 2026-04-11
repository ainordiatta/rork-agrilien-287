import AsyncStorage from '@react-native-async-storage/async-storage';

export function safeJSONParse<T>(data: string | null, key: string): T | null {
  if (!data) return null;
  try {
    const trimmed = data.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      console.log(`[Storage] Invalid ${key} data: empty or null string`);
      return null;
    }
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{') && !trimmed.startsWith('"')) {
      console.log(`[Storage] Invalid ${key} data format: ${trimmed.substring(0, 50)}`);
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[Storage] JSON parse error for ${key}:`, error);
    return null;
  }
}

export async function loadFromStorage<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return safeJSONParse<T>(data, key);
  } catch (error) {
    console.error(`[Storage] Error loading ${key}:`, error);
    return null;
  }
}

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Storage] Error saving ${key}:`, error);
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error);
  }
}
