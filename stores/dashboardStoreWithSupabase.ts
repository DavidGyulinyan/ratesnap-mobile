import { create } from 'zustand';

// Widget interface
export interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, any>;
}

// Cross-platform storage that doesn't import AsyncStorage at module level
const createStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Web: use localStorage
    console.log('🌐 Using localStorage for web environment');
    return {
      getItem: (key: string) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          return Promise.resolve(null);
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          return Promise.resolve();
        }
      },
    };
  } else {
    // Native environment or fallback
    console.log('📱 Using in-memory storage (AsyncStorage not available)');
    const memory = new Map();
    return {
      getItem: (key: string) => Promise.resolve(memory.get(key) || null),
      setItem: (key: string, value: string) => {
        memory.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        memory.delete(key);
        return Promise.resolve();
      },
    };
  }
};

const storage = createStorage();

// Import Supabase with error handling - this should work in both environments
let supabase: any = null;
let DashboardAPI: any = null;
let AuthAPI: any = null;

try {
  const supabaseModule = require('@/lib/supabase');
  supabase = supabaseModule.supabase;
  DashboardAPI = supabaseModule.DashboardAPI;
  AuthAPI = supabaseModule.AuthAPI;
  console.log('✅ Supabase loaded successfully');
} catch (error) {
  console.warn('⚠️ Supabase not available:', error instanceof Error ? error.message : 'Unknown error');
}

// Create mock APIs for development/fallback
const MockDashboardAPI = {
  async getUserDashboards() {
    console.log('🔧 Mock: getUserDashboards');
    return [];
  },
  async getDashboard(id: string) {
    console.log('🔧 Mock: getDashboard', id);
    return null;
  },
  async createDashboard(name: string, layout: any[]) {
    console.log('🔧 Mock: createDashboard', name);
    return {
      id: 'mock-' + Date.now(),
      user_id: 'mock-user',
      name,
      layout,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  async updateDashboard(id: string, name: string, layout: any[]) {
    console.log('🔧 Mock: updateDashboard', id);
    return {
      id,
      user_id: 'mock-user',
      name,
      layout,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
  async deleteDashboard(id: string) {
    console.log('🔧 Mock: deleteDashboard', id);
  },
  async getDefaultDashboard() {
    console.log('🔧 Mock: getDefaultDashboard');
    return null;
  },
  async setDefaultDashboard(id: string) {
    console.log('🔧 Mock: setDefaultDashboard', id);
    return {
      id,
      user_id: 'mock-user',
      name: 'Mock Dashboard',
      layout: [],
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },
};

const MockAuthAPI = {
  async signUp(email: string, password: string) {
    console.log('🔧 Mock: signUp', email);
    return { user: { id: 'mock-user', email }, session: {} };
  },
  async signIn(email: string, password: string) {
    console.log('🔧 Mock: signIn', email);
    return { user: { id: 'mock-user', email }, session: {} };
  },
  async signOut() {
    console.log('🔧 Mock: signOut');
  },
  async getCurrentUser() {
    console.log('🔧 Mock: getCurrentUser');
    return { id: 'mock-user', email: 'demo@example.com' };
  },
  async getSession() {
    console.log('🔧 Mock: getSession');
    return null;
  },
};

// Use real APIs if available, otherwise use mocks
const realDashboardsAvailable = !!(DashboardAPI && AuthAPI && supabase);
const RealDashboardAPI = realDashboardsAvailable ? DashboardAPI : MockDashboardAPI;
const RealAuthAPI = realDashboardsAvailable ? AuthAPI : MockAuthAPI;

// Dashboard store interface
interface DashboardStoreWithSupabase {
  widgets: Widget[];
  selectedWidgetId: string | null;
  
  // Supabase state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userDashboards: any[];
  currentDashboard: any | null;

  // Actions
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  selectWidget: (id: string | null) => void;
  clearLayout: () => void;
  
  // Supabase actions
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveToSupabase: (name?: string) => Promise<void>;
  loadFromSupabase: (dashboardId?: string) => Promise<void>;
  loadDefaultDashboard: () => Promise<void>;
  createNewDashboard: (name: string) => Promise<void>;
  listDashboards: () => Promise<void>;
}

// Create the store
export const useDashboardStoreWithSupabase = create<DashboardStoreWithSupabase>((set, get) => ({
  // Initial state
  widgets: [],
  selectedWidgetId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  userDashboards: [],
  currentDashboard: null,

  // Widget actions
  addWidget: (widgetData) => {
    const newWidget: Widget = {
      ...widgetData,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    set((state) => ({
      widgets: [...state.widgets, newWidget],
    }));
  },

  removeWidget: (id) => {
    set((state) => ({
      widgets: state.widgets.filter((widget) => widget.id !== id),
      selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
    }));
  },

  updateWidget: (id, updates) => {
    set((state) => ({
      widgets: state.widgets.map((widget) =>
        widget.id === id ? { ...widget, ...updates } : widget
      ),
    }));
  },

  selectWidget: (id) => {
    set({ selectedWidgetId: id });
  },

  clearLayout: () => {
    set({ 
      widgets: [],
      selectedWidgetId: null,
    });
  },

  // Supabase actions
  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (!RealAuthAPI) {
        throw new Error('Authentication not available');
      }
      
      const user = await RealAuthAPI.getCurrentUser();
      set({ 
        isAuthenticated: !!user,
        isLoading: false,
        error: null 
      });
      
      if (user) {
        await get().listDashboards();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Authentication error',
        isAuthenticated: false 
      });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      if (!RealAuthAPI) {
        throw new Error('Authentication not available');
      }
      
      await RealAuthAPI.signIn(email, password);
      
      set({ 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      
      await get().listDashboards();
    } catch (error) {
      console.error('Error signing in:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed',
        isAuthenticated: false 
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      if (!RealAuthAPI) {
        throw new Error('Authentication not available');
      }
      
      await RealAuthAPI.signUp(email, password);
      
      set({ 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
      
      await get().listDashboards();
    } catch (error) {
      console.error('Error signing up:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign up failed',
        isAuthenticated: false 
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      if (!RealAuthAPI) {
        throw new Error('Authentication not available');
      }
      
      await RealAuthAPI.signOut();
      
      set({ 
        isAuthenticated: false, 
        isLoading: false,
        error: null,
        userDashboards: [],
        currentDashboard: null,
        widgets: [],
        selectedWidgetId: null,
      });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Sign out failed'
      });
      throw error;
    }
  },

  saveToSupabase: async (name = 'My Dashboard') => {
    set({ isLoading: true, error: null });
    
    try {
      const { widgets, currentDashboard } = get();
      
      if (!RealDashboardAPI) {
        throw new Error('Dashboard API not available');
      }
      
      if (currentDashboard) {
        // Update existing dashboard
        await RealDashboardAPI.updateDashboard(currentDashboard.id, name, widgets);
      } else {
        // Create new dashboard
        const newDashboard = await RealDashboardAPI.createDashboard(name, widgets);
        set({ currentDashboard: newDashboard });
      }
      
      set({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Save failed'
      });
      throw error;
    }
  },

  loadFromSupabase: async (dashboardId?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      if (!RealDashboardAPI) {
        throw new Error('Dashboard API not available');
      }
      
      let dashboard;
      if (dashboardId) {
        dashboard = await RealDashboardAPI.getDashboard(dashboardId);
      } else {
        dashboard = await RealDashboardAPI.getDefaultDashboard();
      }
      
      if (dashboard) {
        set({ 
          widgets: dashboard.layout || [],
          currentDashboard: dashboard,
          isLoading: false,
          error: null
        });
      } else {
        set({ 
          isLoading: false, 
          error: 'No dashboard found',
          widgets: []
        });
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Load failed'
      });
      throw error;
    }
  },

  loadDefaultDashboard: async () => {
    await get().loadFromSupabase();
  },

  createNewDashboard: async (name: string) => {
    set({ isLoading: true, error: null });
    
    try {
      if (!RealDashboardAPI) {
        throw new Error('Dashboard API not available');
      }
      
      const newDashboard = await RealDashboardAPI.createDashboard(name, []);
      
      set({ 
        currentDashboard: newDashboard,
        widgets: [],
        isLoading: false,
        error: null
      });
      
      await get().listDashboards();
    } catch (error) {
      console.error('Error creating dashboard:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Create failed'
      });
      throw error;
    }
  },

  listDashboards: async () => {
    try {
      if (!RealDashboardAPI) {
        throw new Error('Dashboard API not available');
      }
      
      const dashboards = await RealDashboardAPI.getUserDashboards();
      set({ userDashboards: dashboards });
      
      // Auto-load default dashboard if none is loaded
      const { currentDashboard } = get();
      if (!currentDashboard && dashboards.length > 0) {
        const defaultDashboard = dashboards.find((d: any) => d.is_default) || dashboards[0];
        if (defaultDashboard) {
          set({ 
            widgets: defaultDashboard.layout || [],
            currentDashboard: defaultDashboard
          });
        }
      }
    } catch (error) {
      console.error('Error listing dashboards:', error);
      set({ error: error instanceof Error ? error.message : 'List failed' });
    }
  },
}));

// Helper function to create widgets with default properties
export const createDefaultWidgetWithProps = (
  type: string,
  x = 0,
  y = 0,
  w = 4,
  h = 3
): Omit<Widget, 'id'> => {
  const defaultProps: Record<string, any> = {
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
  };

  switch (type) {
    case 'currency-converter':
      return {
        type,
        x,
        y,
        w,
        h,
        props: {
          ...defaultProps,
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
          amount: 100,
        },
      };
    case 'chart':
      return {
        type,
        x,
        y,
        w,
        h,
        props: {
          ...defaultProps,
          chartType: 'line',
          dataSource: 'realtime',
        },
      };
    default:
      return {
        type,
        x,
        y,
        w,
        h,
        props: defaultProps,
      };
  }
};