import { create } from 'zustand';

// Widget interface matching the requirements
export interface Widget {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, any>;
}

// Dashboard store interface
interface DashboardStore {
  widgets: Widget[];
  selectedWidgetId: string | null;
  
  // Actions
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  selectWidget: (id: string | null) => void;
  saveLayout: () => string;
  loadLayout: (layoutJson: string) => void;
  clearLayout: () => void;
}

// Create the store
export const useDashboardStore = create<DashboardStore>((set, get) => ({
  widgets: [],
  selectedWidgetId: null,

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

  clearLayout: () => {
    set({ 
      widgets: [],
      selectedWidgetId: null,
    });
    console.log('📦 Dashboard Layout Cleared');
  },
}));

// Helper functions for common widget types
export const createDefaultWidget = (type: string, x = 0, y = 0, w = 4, h = 3): Omit<Widget, 'id'> => {
  const defaultProps: Record<string, any> = {
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Widget`,
  };

  // Customize props based on widget type
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