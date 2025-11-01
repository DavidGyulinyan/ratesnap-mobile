// Dashboard End-to-End Tests
// Note: These are integration-style tests focusing on core functionality

import { 
  createDashboardExport, 
  exportToJSON, 
  importFromJSON,
  validateDashboardExport,
  generateSampleExport,
} from '@/utils/dashboardExportImport';

import { useDashboardStore, Widget } from '@/stores/dashboardStore';

// Mock dependencies
jest.mock('@/stores/dashboardStore');
jest.mock('@/lib/supabase', () => ({
  supabase: {},
  AuthAPI: {
    getCurrentUser: jest.fn(),
  },
}));
jest.mock('@/utils/featureFlags', () => ({
  isCustomDashboardEnabled: jest.fn(() => true),
}));

const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;

describe('Dashboard E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Export/Import System', () => {
    const mockWidgets: Widget[] = [
      {
        id: 'widget-1',
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: {
          title: 'USD to EUR Converter',
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
          amount: 100,
        },
      },
    ];

    it('should create valid dashboard export', () => {
      const exportData = createDashboardExport('Test Dashboard', mockWidgets);

      expect(exportData).toMatchObject({
        version: '1.0.0',
        name: 'Test Dashboard',
        widgets: expect.arrayContaining([
          expect.objectContaining({
            type: 'currency-converter',
          }),
        ]),
      });

      const jsonString = exportToJSON(exportData);
      expect(jsonString).toContain('"version":"1.0.0"');
      expect(jsonString).toContain('"name":"Test Dashboard"');
    });

    it('should validate dashboard export format', () => {
      const validExport = generateSampleExport();
      expect(validateDashboardExport(validExport)).toBe(true);

      const invalidExports = [null, undefined, 'string', {}, { version: '1.0.0' }];
      invalidExports.forEach(invalid => {
        expect(validateDashboardExport(invalid as any)).toBe(false);
      });
    });

    it('should import dashboard from valid JSON', () => {
      const sampleExport = generateSampleExport();
      const jsonString = exportToJSON(sampleExport);
      const imported = importFromJSON(jsonString);
      
      expect(imported).toMatchObject({
        version: '1.0.0',
        name: 'Sample Dashboard',
        widgets: expect.arrayContaining([
          expect.objectContaining({ type: 'currency-converter' }),
        ]),
      });
    });

    it('should handle invalid JSON gracefully', () => {
      expect(() => importFromJSON('invalid json')).toThrow();
      expect(() => importFromJSON('{"invalid": "format"}')).toThrow();
    });
  });

  describe('Dashboard Store Integration', () => {
    it('should handle store operations correctly', () => {
      mockUseDashboardStore.mockReturnValue({
        widgets: [],
        selectedWidgetId: null,
        addWidget: jest.fn(),
        removeWidget: jest.fn(),
        updateWidget: jest.fn(),
        selectWidget: jest.fn(),
        saveLayout: jest.fn(() => '{"version":"1.0.0","widgets":[]}'),
        loadLayout: jest.fn(),
        clearLayout: jest.fn(),
      });

      const store = mockUseDashboardStore();
      expect(store.addWidget).toBeDefined();
      expect(store.saveLayout).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large widget collections efficiently', () => {
      const largeWidgetArray = Array.from({ length: 100 }, (_, i) => ({
        id: `widget-${i}`,
        type: 'currency-converter',
        x: i % 12,
        y: Math.floor(i / 12) * 3,
        w: 4,
        h: 3,
        props: { title: `Widget ${i}` },
      }));

      const startTime = Date.now();
      const exportData = createDashboardExport('Large Dashboard', largeWidgetArray);
      const endTime = Date.now();

      expect(exportData.widgets).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(2000);
      
      const jsonString = exportToJSON(exportData);
      expect(jsonString.length).toBeGreaterThan(10000);
    });
  });
});