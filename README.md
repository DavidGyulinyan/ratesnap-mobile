# RateSnap - Real-time Currency Converter 📱

A modern, user-friendly mobile currency converter app built with React Native and Expo. Get real-time exchange rates for 160+ currencies with a clean, intuitive interface.

![RateSnap Preview](https://via.placeholder.com/300x600/2563eb/ffffff?text=RateSnap+App)

## ✨ Features

- **Real-time Currency Conversion** - Live exchange rates updated hourly
- **160+ Currencies Supported** - Comprehensive currency coverage
- **Interactive Currency Selection** - Search and select currencies with ease
- **Save Favorite Rates** - Store frequently used exchange rates
- **Conversion History** - Track your conversion history locally
- **Cross-Platform** - Works on iOS, Android, and Web
- **Offline Ready** - Local storage for saved rates and history
- **Modern UI** - Clean, responsive design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ratesnap-mobile.git
   cd ratesnap-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_URL=https://v6.exchangerate-api.com/v6/
   EXPO_PUBLIC_API_KEY=your_api_key_here

   # Feature Flags
   EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=false

   # Supabase Configuration (for dashboard persistence)
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get your free API key from [ExchangeRate-API](https://www.exchangerate-api.com/)
   
   **For dashboard persistence**, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**

   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

## 📱 Usage

### Basic Conversion
1. Enter the amount you want to convert
2. Tap "From" to select the source currency
3. Tap "To" to select the target currency
4. View the converted amount instantly

### Saving Rates
- Tap "Save This Rate" to store frequently used conversions
- Access saved rates in the expandable "Saved Rates" section
- Tap any saved rate to quickly load it for conversion

### Managing History
- Your conversion history is automatically saved locally
- Recently used currencies appear first in the selection lists

## 🏗️ Project Structure

```
ratesnap-mobile/
├── app/                    # App screens (file-based routing)
│   ├── _layout.tsx        # Root layout
│   ├── dashboard.tsx      # Custom dashboard (behind feature flag)
│   └── (tabs)/            # Tab navigation
│       ├── _layout.tsx    # Tab layout
│       ├── index.tsx      # Main converter screen
│       └── explore.tsx    # About/Info screen
├── components/            # Reusable components
│   ├── CurrencyConverter.tsx  # Main converter component
│   ├── CurrencyPicker.tsx     # Currency selection modal
│   ├── DashboardShell.tsx     # Dashboard shell component
│   ├── WidgetContainer.tsx    # Individual widget wrapper
│   ├── DashboardGrid.tsx      # Grid system for widgets
│   └── ui/               # UI components
├── stores/               # State management
│   ├── dashboardStore.ts     # Basic dashboard store
│   └── dashboardStoreWithSupabase.ts # Supabase-enhanced store
├── lib/                  # External integrations
│   └── supabase.ts          # Supabase client and API
├── supabase/             # Database configuration
│   └── migrations/          # Database migration files
├── utils/                # Utility functions
│   └── featureFlags.ts   # Feature flag management
├── tests/                # Unit tests
├── constants/            # App constants and themes
├── hooks/               # Custom React hooks
├── assets/              # Images and static assets
└── scripts/             # Utility scripts
```

## 🚧 Feature Flag System

This project includes a **Custom Dashboard** feature that can be enabled/disabled via environment variables.

### Custom Dashboard Feature

The custom dashboard provides a customizable interface for users to personalize their currency conversion experience.

#### Configuration

To enable the custom dashboard, set the feature flag in your `.env` file:

```env
EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true
```

#### Behavior

- **When disabled** (`EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=false`):
  - `/dashboard` route redirects to home page
  - Dashboard feature is completely hidden from users
  - No performance impact on the main app

- **When enabled** (`EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true`):
  - `/dashboard` route loads the `DashboardShell` component
  - Users can access the customizable dashboard interface
  - Full dashboard functionality is available

#### Implementation Details

- **Feature Flag Utility**: `utils/featureFlags.ts`
- **Dashboard Route**: `app/dashboard.tsx`
- **Dashboard Component**: `components/DashboardShell.tsx`
- **Tests**: `tests/featureFlags.test.ts`

#### Development Workflow

1. **Development**: Set `EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true` to develop dashboard features
2. **Testing**: Use `npm test` to run feature flag tests
3. **Production**: Keep disabled until ready for public release

```bash
# Enable for development
echo "EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD=true" >> .env

# Run development server
npx expo start

# Test the feature
npm test
```

## 💾 Supabase Dashboard Persistence

The custom dashboard includes **full persistence** using Supabase for secure cloud storage and authentication.

### Features

- **User Authentication** - Secure sign up/sign in with email and password
- **Cloud Storage** - Dashboard layouts saved to Supabase database
- **Row Level Security** - Users can only access their own dashboards
- **Multiple Dashboards** - Create and manage multiple dashboard configurations
- **Real-time Sync** - Changes saved immediately and available across devices

### Setup Requirements

1. **Create Supabase Project**: Sign up at [supabase.com](https://supabase.com)
2. **Run Migration**: Apply the database schema from `supabase/migrations/001_create_user_dashboards.sql`
3. **Configure Authentication**: Enable email authentication in Supabase dashboard
4. **Update Environment**: Add Supabase URL and anon key to `.env` file

**📖 Complete setup instructions**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Usage

1. **Sign Up/Sign In**: Use the authentication buttons in the dashboard
2. **Add Widgets**: Create your custom dashboard layout
3. **Save**: Click "Save to Supabase" to persist your layout
4. **Load**: Dashboard automatically loads saved layout on refresh
5. **Manage**: Create multiple dashboards and switch between them

### API Integration

```typescript
// The system provides these key functions:
await DashboardAPI.createDashboard(name, layout);
await DashboardAPI.getDefaultDashboard();
await DashboardAPI.saveToSupabase();
await DashboardAPI.loadFromSupabase();
```

### Security

- **Row Level Security (RLS)**: Database policies ensure data isolation
- **JWT Authentication**: Secure token-based authentication
- **Client-side Validation**: Input sanitization and error handling
- **Environment Variables**: Sensitive keys stored securely

## 🛠️ Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
- **Zustand** - Lightweight state management
- **Supabase** - Backend-as-a-Service with authentication and database
- **AsyncStorage** - Local data persistence
- **ExchangeRate-API** - Real-time currency data

## 📋 API Reference

This app uses the [ExchangeRate-API](https://www.exchangerate-api.com/) for currency data.

- **Base URL**: `https://v6.exchangerate-api.com/v6/`
- **Endpoints**: Latest rates, conversion rates
- **Update Frequency**: Hourly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ExchangeRate-API](https://www.exchangerate-api.com/) for providing free currency data
- [Expo](https://expo.dev) for the amazing development platform
- [React Native](https://reactnative.dev) community

## 📞 Support

If you have any questions or issues:

- Create an [issue](https://github.com/yourusername/ratesnap-mobile/issues) on GitHub
- Check the [Terms of Use](https://docs.google.com/document/d/e/2PACX-1vSqgDzlbEnxw-KoCS6ecj_tGzjSlkxDc7bUBMwzor65LKNLTEqzxm4q2iVvStCkmzo4N6dnVlcRGRuo/pub) for app usage guidelines

---

**Made with ❤️ for seamless currency conversion**
