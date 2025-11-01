import { Widget } from '@/stores/dashboardStore';
import { DashboardAPI } from '@/lib/supabase';

export interface DashboardExport {
  version: string;
  exported_at: string;
  name: string;
  widgets: Widget[];
  metadata?: {
    preset_used?: string;
    theme_preference?: string;
    notes?: string;
  };
}

// Default export template
export const createDashboardExport = (
  name: string,
  widgets: Widget[],
  metadata?: DashboardExport['metadata']
): DashboardExport => ({
  version: '1.0.0',
  exported_at: new Date().toISOString(),
  name,
  widgets: widgets.map(widget => ({
    ...widget,
    id: generateStableId(widget), // Generate stable IDs for import
  })),
  metadata,
});

// Generate stable ID based on widget properties
const generateStableId = (widget: Widget): string => {
  const { type, x, y, w, h } = widget;
  return `${type}-${x}-${y}-${w}-${h}-${Date.now()}`;
};

// Validate exported dashboard format
export const validateDashboardExport = (data: any): data is DashboardExport => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  return (
    typeof data.version === 'string' &&
    typeof data.exported_at === 'string' &&
    typeof data.name === 'string' &&
    Array.isArray(data.widgets) &&
    data.widgets.every(isValidWidget)
  );
};

const isValidWidget = (widget: any): widget is Widget => {
  return (
    widget &&
    typeof widget.id === 'string' &&
    typeof widget.type === 'string' &&
    typeof widget.x === 'number' &&
    typeof widget.y === 'number' &&
    typeof widget.w === 'number' &&
    typeof widget.h === 'number' &&
    widget.props &&
    typeof widget.props === 'object'
  );
};

// Export dashboard to JSON string
export const exportToJSON = (exportData: DashboardExport): string => {
  return JSON.stringify(exportData, null, 2);
};

// Export dashboard to downloadable file
export const exportToFile = (exportData: DashboardExport, filename?: string): void => {
  const jsonString = exportToJSON(exportData);
  const finalFilename = filename || `dashboard-${exportData.name}-${new Date().toISOString().split('T')[0]}.json`;
  
  // For web: create and trigger download
  if (typeof window !== 'undefined' && window.document) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // For mobile: log the JSON (in a real app, you'd use share dialog or file system)
    console.log('Dashboard Export:', jsonString);
    console.log('Use this JSON to import your dashboard layout');
  }
};

// Import dashboard from JSON string
export const importFromJSON = (jsonString: string): DashboardExport => {
  try {
    const data = JSON.parse(jsonString);
    
    if (!validateDashboardExport(data)) {
      throw new Error('Invalid dashboard export format');
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse dashboard JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Import dashboard from file
export const importFromFile = (file: File): Promise<DashboardExport> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const dashboardExport = importFromJSON(content);
        resolve(dashboardExport);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Save dashboard to Supabase
export const saveDashboardToSupabase = async (
  name: string,
  widgets: Widget[],
  isDefault: boolean = false
): Promise<void> => {
  try {
    await DashboardAPI.createDashboard(name, widgets);
    console.log('✅ Dashboard saved to Supabase');
  } catch (error) {
    console.error('❌ Failed to save dashboard to Supabase:', error);
    throw error;
  }
};

// Load dashboard from Supabase
export const loadDashboardFromSupabase = async (): Promise<any[]> => {
  try {
    const dashboards = await DashboardAPI.getUserDashboards();
    return dashboards;
  } catch (error) {
    console.error('❌ Failed to load dashboards from Supabase:', error);
    throw error;
  }
};

// Convert imported widgets to current format with new IDs
export const convertImportedWidgets = (widgets: Widget[]): Widget[] => {
  return widgets.map(widget => ({
    ...widget,
    id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }));
};

// Generate sample export for testing
export const generateSampleExport = (): DashboardExport => {
  return createDashboardExport(
    'Sample Dashboard',
    [
      {
        id: 'sample-1',
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 6,
        h: 3,
        props: {
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
          amount: 100,
        },
      },
      {
        id: 'sample-2',
        type: 'calculator',
        x: 6,
        y: 0,
        w: 6,
        h: 3,
        props: {},
      },
    ],
    {
      preset_used: 'personal',
      theme_preference: 'light',
      notes: 'Sample export for testing',
    }
  );
};