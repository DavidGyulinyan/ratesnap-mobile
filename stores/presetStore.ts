import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DashboardPresets, DashboardPreset } from '@/styles/theme';

// Preset store interface
interface PresetStore {
  savedPresets: DashboardPreset[];
  isLoading: boolean;
  
  // Actions
  saveCurrentLayout: (name: string, description?: string) => Promise<void>;
  loadPreset: (presetId: string) => Promise<DashboardPreset | null>;
  deletePreset: (presetId: string) => Promise<void>;
  getAllPresets: () => DashboardPreset[];
  loadPresetsFromStorage: () => Promise<void>;
}

// Create the store
export const usePresetStore = create<PresetStore>((set, get) => ({
  savedPresets: [],
  isLoading: false,

  saveCurrentLayout: async (name: string, description?: string) => {
    set({ isLoading: true });
    
    try {
      // Get current layout from dashboard store (would need to import it)
      const currentLayout = {
        // This would come from useDashboardStore().widgets
        widgets: [], // Simplified for now
      };

      const newPreset: DashboardPreset = {
        id: `preset-${Date.now()}`,
        name,
        description: description || 'Custom preset',
        icon: '⭐',
        category: 'personal',
        widgets: currentLayout.widgets,
      };

      const savedPresets = [...get().savedPresets, newPreset];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('@dashboard_presets', JSON.stringify(savedPresets));
      
      set({ savedPresets, isLoading: false });
      console.log('📦 Preset saved:', name);
    } catch (error) {
      console.error('Failed to save preset:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  loadPreset: async (presetId: string) => {
    set({ isLoading: true });
    
    try {
      const preset = get().savedPresets.find(p => p.id === presetId);
      if (!preset) {
        throw new Error('Preset not found');
      }

      // Load the preset into dashboard (would integrate with dashboard store)
      console.log('📦 Loading preset:', preset.name);
      
      // This would integrate with useDashboardStore() to replace current widgets
      // For now, we'll just log it
      set({ isLoading: false });
      return preset;
    } catch (error) {
      console.error('Failed to load preset:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  deletePreset: async (presetId: string) => {
    set({ isLoading: true });
    
    try {
      const savedPresets = get().savedPresets.filter(p => p.id !== presetId);
      await AsyncStorage.setItem('@dashboard_presets', JSON.stringify(savedPresets));
      
      set({ savedPresets, isLoading: false });
      console.log('🗑️ Preset deleted:', presetId);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  getAllPresets: () => {
    const savedPresets = get().savedPresets;
    return [...DashboardPresets, ...savedPresets];
  },

  loadPresetsFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem('@dashboard_presets');
      if (stored) {
        const savedPresets = JSON.parse(stored);
        set({ savedPresets });
        console.log('📦 Loaded presets from storage:', savedPresets.length);
      }
    } catch (error) {
      console.error('Failed to load presets from storage:', error);
    }
  },
}));

// Initialize presets on app start
export const initializePresets = async () => {
  const { loadPresetsFromStorage } = usePresetStore.getState();
  await loadPresetsFromStorage();
};