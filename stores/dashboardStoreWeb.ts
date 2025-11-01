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

// Web-compatible dashboard store without Supabase
interface DashboardStoreWeb {
  widgets: Widget[];
  selectedWidgetId: string | null;
  
  // Actions
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  selectWidget: (id: string | null) => void;
  clearLayout: () => void;
  saveLayout: () => string;
  loadLayout: (layoutJson: string) => void;
}

// Create the store for web development
export const useDashboardStoreWeb = create<DashboardStoreWeb>((set, get) => ({
  // Initial state
  widgets: [],
  selectedWidgetId: null,

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

  saveLayout: () => {
    const { widgets } = get();
    const layoutData = {
      widgets,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    
    const jsonString = JSON.stringify(layoutData, null, 2);
    console.log('📦 Dashboard Layout Saved:', jsonString);
    
    return jsonString;
  },

  loadLayout: (layoutJson) => {
    try {
      const layoutData = JSON.parse(layoutJson);
      
      if (layoutData.widgets && Array.isArray(layoutData.widgets)) {
        set({ 
          widgets: layoutData.widgets,
          selectedWidgetId: null,
        });
        
        console.log('📦 Dashboard Layout Loaded:', layoutData);
      } else {
        throw new Error('Invalid layout format');
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
      throw error;
    }
  },
}));

// Helper function to create widgets with default properties
export const createDefaultWidget = (
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
    case 'rate-table':
      return {
        type,
        x,
        y,
        w,
        h,
        props: {
          ...defaultProps,
          baseCurrency: 'USD',
          showColumns: ['code', 'rate', 'change'],
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

// Use web store by default in development
export const useDashboardStore = useDashboardStoreWeb;