// Safe AsyncStorage utility for both web and native environments
let cachedStorage: any = null;

export const getAsyncStorage = () => {
  if (cachedStorage) return cachedStorage;
  
  // Check if we're in a browser environment with window available
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Web environment - use localStorage
      cachedStorage = {
        getItem: (key: string) => {
          try {
            return Promise.resolve(window.localStorage.getItem(key) || null);
          } catch (error) {
            console.warn('localStorage.getItem failed:', error);
            return Promise.resolve(null);
          }
        },
        setItem: (key: string, value: string) => {
          try {
            window.localStorage.setItem(key, value);
            return Promise.resolve();
          } catch (error) {
            console.warn('localStorage.setItem failed:', error);
            return Promise.resolve();
          }
        },
        removeItem: (key: string) => {
          try {
            window.localStorage.removeItem(key);
            return Promise.resolve();
          } catch (error) {
            console.warn('localStorage.removeItem failed:', error);
            return Promise.resolve();
          }
        },
        getAllKeys: () => {
          try {
            return Promise.resolve(Object.keys(window.localStorage || {}));
          } catch (error) {
            console.warn('localStorage.getAllKeys failed:', error);
            return Promise.resolve([]);
          }
        },
        clear: () => {
          try {
            window.localStorage.clear();
            return Promise.resolve();
          } catch (error) {
            console.warn('localStorage.clear failed:', error);
            return Promise.resolve();
          }
        },
      };
      return cachedStorage;
    }
  } catch (error) {
    console.warn('Window check failed, falling back to native storage:', error);
  }
  
  // Check if we're in a React Native environment
  try {
    // Try to require AsyncStorage only in React Native environment
    if (typeof require !== 'undefined') {
      try {
        // Dynamic import to avoid bundling issues
        const AsyncStorageModule = require('@react-native-async-storage/async-storage');
        const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
        if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
          cachedStorage = AsyncStorage;
          return cachedStorage;
        }
      } catch (importError) {
        // AsyncStorage not available, fall through to fallback
        console.log('AsyncStorage not available, using fallback');
      }
    }
  } catch (error) {
    console.warn('React Native import failed:', error);
  }
  
  // Fallback storage for environments where neither web nor native storage is available
  // This is essential for server-side rendering and some build environments
  const inMemoryStore = new Map<string, string>();
  
  cachedStorage = {
    getItem: (key: string) => {
      try {
        return Promise.resolve(inMemoryStore.get(key) || null);
      } catch (error) {
        console.warn('inMemoryStore.getItem failed:', error);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        inMemoryStore.set(key, value);
        return Promise.resolve();
      } catch (error) {
        console.warn('inMemoryStore.setItem failed:', error);
        return Promise.resolve();
      }
    },
    removeItem: (key: string) => {
      try {
        inMemoryStore.delete(key);
        return Promise.resolve();
      } catch (error) {
        console.warn('inMemoryStore.removeItem failed:', error);
        return Promise.resolve();
      }
    },
    getAllKeys: () => {
      try {
        return Promise.resolve(Array.from(inMemoryStore.keys()));
      } catch (error) {
        console.warn('inMemoryStore.getAllKeys failed:', error);
        return Promise.resolve([]);
      }
    },
    clear: () => {
      try {
        inMemoryStore.clear();
        return Promise.resolve();
      } catch (error) {
        console.warn('inMemoryStore.clear failed:', error);
        return Promise.resolve();
      }
    },
  };
  
  console.log('Using fallback in-memory storage');
  return cachedStorage;
};