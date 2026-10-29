import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY, serialStorage } from '../core/schema';
export const nativeStorage = serialStorage({
  get: () => AsyncStorage.getItem(STORAGE_KEY),
  set: (value: string) => AsyncStorage.setItem(STORAGE_KEY, value),
  remove: () => AsyncStorage.removeItem(STORAGE_KEY),
});
