# Borla Wura - React Native Mobile App

This is the React Native mobile version of the Borla Wura waste management application, converted from a React web application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. For iOS:
```bash
cd ios && pod install && cd ..
npm run ios
```

3. For Android:
```bash
npm run android
```

## Project Structure

- `src/App.tsx` - Main app with React Navigation setup
- `src/components/` - Reusable components (Button, Navigation, BottomNavigation)
- `src/pages/` - All page components
- `src/utils/` - Utility functions (navigation, icons, receipt generator)
- `src/i18n/` - Internationalization setup

## Key Features Converted

✅ React Navigation routing
✅ NativeWind (Tailwind CSS for React Native)
✅ RemixIcons → Ionicons via utility wrapper
✅ All pages and components
✅ Form handling with TextInput
✅ Modal dialogs
✅ Image loading
✅ Location services
✅ Receipt generation and sharing

## Remaining Pages Status

### Completed ✅
- Home Page (with all components)
- Booking Page (with all components)
- NotFound Page
- Core utilities and navigation

### In Progress
- Orders Page
- Profile Page  
- Services Page
- Support Page
- Track Order Page
- Profile sub-pages (Payment Methods, Notifications, Referral, Terms, About)

## Notes

- All browser-specific APIs have been replaced with React Native equivalents
- `window.REACT_APP_NAVIGATE` → `navigateTo()` utility
- HTML elements → React Native components (View, Text, TouchableOpacity, etc.)
- CSS/Tailwind → StyleSheet with NativeWind support
- RemixIcons mapped to Ionicons

## Development

The app uses:
- **React Navigation** for routing
- **Expo** for development and build
- **NativeWind** for styling (Tailwind CSS)
- **@expo/vector-icons** for icons
- **expo-location** for location services
- **expo-sharing** for file sharing



