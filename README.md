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
   ```

   Get your free API key from [ExchangeRate-API](https://www.exchangerate-api.com/)

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
│   └── (tabs)/            # Tab navigation
│       ├── _layout.tsx    # Tab layout
│       ├── index.tsx      # Main converter screen
│       └── explore.tsx    # About/Info screen
├── components/            # Reusable components
│   ├── CurrencyConverter.tsx  # Main converter component
│   ├── CurrencyPicker.tsx     # Currency selection modal
│   └── ui/               # UI components
├── constants/            # App constants and themes
├── hooks/               # Custom React hooks
├── assets/              # Images and static assets
└── scripts/             # Utility scripts
```

## 🛠️ Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript
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
