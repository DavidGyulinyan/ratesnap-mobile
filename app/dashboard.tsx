import { isCustomDashboardEnabled } from '@/utils/featureFlags';
import { DashboardShell } from '@/components/DashboardShell';
import { AuthGate } from '@/components/AuthGate';

export default function DashboardPage() {
  // Redirect to home if feature flag is disabled
  if (!isCustomDashboardEnabled()) {
    return null; // The redirect logic should be handled by the route configuration
  }

  return (
    <AuthGate>
      <DashboardShell />
    </AuthGate>
  );
}