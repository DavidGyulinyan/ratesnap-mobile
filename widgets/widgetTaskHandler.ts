import type { WidgetTaskHandler } from 'react-native-android-widget';
import { renderWidgetForTask } from './renderAndroidWidget';
import { removeOsWidgetConfig } from './runtime/storage';

export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetAction,
  widgetInfo,
  renderWidget,
}) => {
  if (widgetAction === 'WIDGET_DELETED') {
    await removeOsWidgetConfig(widgetInfo.widgetId);
    return;
  }

  const tree = await renderWidgetForTask(widgetInfo.widgetName, widgetInfo);
  renderWidget(tree);
};
