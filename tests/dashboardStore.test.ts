import { useDashboardStore, createDefaultWidget } from '@/stores/dashboardStore';

describe('DashboardStore', () => {
  beforeEach(() => {
    // Clear store before each test
    useDashboardStore.setState({
      widgets: [],
      selectedWidgetId: null,
    });
  });

  describe('Widget Management', () => {
    it('should add a widget successfully', () => {
      const { addWidget } = useDashboardStore.getState();
      
      const widgetData = {
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Test Widget' },
      };
      
      addWidget(widgetData);
      
      const state = useDashboardStore.getState();
      expect(state.widgets).toHaveLength(1);
      expect(state.widgets[0]).toMatchObject(widgetData);
      expect(state.widgets[0]).toHaveProperty('id');
    });

    it('should remove a widget successfully', () => {
      const { addWidget, removeWidget } = useDashboardStore.getState();
      
      // Add a widget
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Test Widget' },
      });
      
      const widgetId = useDashboardStore.getState().widgets[0].id;
      
      // Remove the widget
      removeWidget(widgetId);
      
      const state = useDashboardStore.getState();
      expect(state.widgets).toHaveLength(0);
      expect(state.selectedWidgetId).toBeNull();
    });

    it('should update a widget successfully', () => {
      const { addWidget, updateWidget } = useDashboardStore.getState();
      
      // Add a widget
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Test Widget' },
      });
      
      const widgetId = useDashboardStore.getState().widgets[0].id;
      
      // Update the widget
      updateWidget(widgetId, {
        x: 2,
        y: 1,
        w: 6,
        h: 4,
        props: { title: 'Updated Widget' },
      });
      
      const state = useDashboardStore.getState();
      expect(state.widgets[0]).toMatchObject({
        id: widgetId,
        type: 'currency-converter',
        x: 2,
        y: 1,
        w: 6,
        h: 4,
        props: { title: 'Updated Widget' },
      });
    });

    it('should select a widget', () => {
      const { addWidget, selectWidget } = useDashboardStore.getState();
      
      // Add a widget
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Test Widget' },
      });
      
      const widgetId = useDashboardStore.getState().widgets[0].id;
      
      // Select the widget
      selectWidget(widgetId);
      
      const state = useDashboardStore.getState();
      expect(state.selectedWidgetId).toBe(widgetId);
    });

    it('should deselect widget when removed', () => {
      const { addWidget, removeWidget, selectWidget } = useDashboardStore.getState();
      
      // Add a widget
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Test Widget' },
      });
      
      const widgetId = useDashboardStore.getState().widgets[0].id;
      
      // Select the widget
      selectWidget(widgetId);
      
      // Remove the widget
      removeWidget(widgetId);
      
      const state = useDashboardStore.getState();
      expect(state.selectedWidgetId).toBeNull();
    });
  });

  describe('Layout Save/Load', () => {
    it('should save layout as JSON string', () => {
      const { addWidget, saveLayout } = useDashboardStore.getState();
      
      // Add some widgets
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Widget 1' },
      });
      
      addWidget({
        type: 'chart',
        x: 4,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Widget 2' },
      });
      
      const jsonString = saveLayout();
      
      // Parse and validate the JSON
      const parsed = JSON.parse(jsonString);
      expect(parsed).toHaveProperty('widgets');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('version');
      expect(parsed.widgets).toHaveLength(2);
      expect(parsed.version).toBe('1.0');
    });

    it('should load layout from JSON string', () => {
      const { addWidget, loadLayout } = useDashboardStore.getState();
      
      // Add initial widgets
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Original Widget' },
      });
      
      // Create a layout to load
      const layoutToLoad = {
        widgets: [
          {
            id: 'test-widget-1',
            type: 'chart',
            x: 0,
            y: 0,
            w: 6,
            h: 3,
            props: { title: 'Loaded Widget 1' },
          },
          {
            id: 'test-widget-2',
            type: 'rate-table',
            x: 6,
            y: 0,
            w: 6,
            h: 4,
            props: { title: 'Loaded Widget 2' },
          },
        ],
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0',
      };
      
      // Load the layout
      loadLayout(JSON.stringify(layoutToLoad));
      
      const state = useDashboardStore.getState();
      expect(state.widgets).toHaveLength(2);
      expect(state.widgets[0]).toMatchObject(layoutToLoad.widgets[0]);
      expect(state.widgets[1]).toMatchObject(layoutToLoad.widgets[1]);
      expect(state.selectedWidgetId).toBeNull();
    });

    it('should handle invalid JSON when loading layout', () => {
      const { loadLayout } = useDashboardStore.getState();
      
      // Mock console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => loadLayout('invalid-json')).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should handle malformed layout when loading', () => {
      const { loadLayout } = useDashboardStore.getState();
      
      // Mock console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Layout without widgets array
      const malformedLayout = {
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0',
        // missing widgets
      };
      
      expect(() => loadLayout(JSON.stringify(malformedLayout))).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should clear layout successfully', () => {
      const { addWidget, clearLayout } = useDashboardStore.getState();
      
      // Add widgets
      addWidget({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: { title: 'Test Widget' },
      });
      
      // Select widget
      useDashboardStore.getState().selectWidget(
        useDashboardStore.getState().widgets[0].id
      );
      
      // Clear layout
      clearLayout();
      
      const state = useDashboardStore.getState();
      expect(state.widgets).toHaveLength(0);
      expect(state.selectedWidgetId).toBeNull();
    });
  });

  describe('Default Widget Creation', () => {
    it('should create default currency converter widget', () => {
      const widget = createDefaultWidget('currency-converter', 0, 0, 4, 3);
      
      expect(widget).toMatchObject({
        type: 'currency-converter',
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        props: {
          title: 'Currency-converter Widget',
          sourceCurrency: 'USD',
          targetCurrency: 'EUR',
          amount: 100,
        },
      });
    });

    it('should create default chart widget', () => {
      const widget = createDefaultWidget('chart', 2, 1, 6, 4);
      
      expect(widget).toMatchObject({
        type: 'chart',
        x: 2,
        y: 1,
        w: 6,
        h: 4,
        props: {
          title: 'Chart Widget',
          chartType: 'line',
          dataSource: 'realtime',
        },
      });
    });

    it('should create default rate table widget', () => {
      const widget = createDefaultWidget('rate-table', 0, 3, 12, 4);
      
      expect(widget).toMatchObject({
        type: 'rate-table',
        x: 0,
        y: 3,
        w: 12,
        h: 4,
        props: {
          title: 'Rate-table Widget',
          baseCurrency: 'USD',
          showColumns: ['code', 'rate', 'change'],
        },
      });
    });

    it('should create default widget for unknown type', () => {
      const widget = createDefaultWidget('unknown-widget', 1, 2, 3, 2);
      
      expect(widget).toMatchObject({
        type: 'unknown-widget',
        x: 1,
        y: 2,
        w: 3,
        h: 2,
        props: {
          title: 'Unknown-widget Widget',
        },
      });
    });
  });
});