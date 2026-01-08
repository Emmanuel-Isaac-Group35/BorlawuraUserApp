# React to React Native Conversion Notes

This document outlines the conversion of the Borla Wura React web app to React Native.

## Completed Conversions

### 1. Project Setup
- ✅ Created React Native/Expo project structure
- ✅ Updated package.json with React Native dependencies
- ✅ Configured NativeWind for Tailwind CSS support
- ✅ Set up TypeScript configuration for React Native
- ✅ Created app.json for Expo configuration

### 2. Core Infrastructure
- ✅ Converted i18n configuration (replaced browser detector with expo-localization)
- ✅ Created icon utility (RemixIcon wrapper using @expo/vector-icons)
- ✅ Created navigation utility (replaced window.REACT_APP_NAVIGATE)
- ✅ Set up React Navigation with stack navigator

### 3. Base Components
- ✅ Converted Button component (HTML button → TouchableOpacity)
- ✅ Converted Navigation component
- ✅ Converted BottomNavigation component

### 4. Routing
- ✅ Created React Navigation setup in App.tsx
- ✅ Configured all routes for React Navigation

### 5. Home Page Components
- ✅ Converted HeroSection component

## Remaining Conversions Needed

### Home Page Components
- [ ] NewsSlider - needs ScrollView/FlatList for carousel
- [ ] ServiceCategories - convert grid layout
- [ ] QuickActions - convert grid layout
- [ ] RecentOrders - convert list layout
- [ ] HomePage - main page wrapper

### Booking Page Components
- [ ] LocationSelector - convert input forms
- [ ] ServiceSelector - convert selection UI
- [ ] WasteTypeSelector - convert multi-select
- [ ] PricingSummary - convert summary display
- [ ] BookingPage - main booking page

### Other Pages
- [ ] OrdersPage - convert orders list with modals
- [ ] ProfilePage - convert profile with forms
- [ ] ServicesPage - convert services grid
- [ ] SupportPage - convert FAQ and contact
- [ ] TrackOrderPage - convert map and tracking UI
- [ ] PaymentMethodsPage - convert payment forms
- [ ] NotificationsPage - convert toggle switches
- [ ] ReferralPage - convert sharing functionality
- [ ] TermsPage - convert text display
- [ ] AboutPage - convert about section
- [ ] NotFound - convert 404 page

### Utilities
- [ ] receiptGenerator - convert PDF generation for React Native (use react-native-pdf)

## Key Conversion Patterns

### HTML Elements → React Native Components
- `div` → `View`
- `button` → `TouchableOpacity`
- `input` → `TextInput`
- `img` → `Image`
- `span`, `p`, `h1-h6` → `Text`
- `a` → `TouchableOpacity` with navigation
- `form` → `View` with `TextInput` components
- `select` → `Picker` or modal with selection

### CSS Classes → StyleSheet
- All Tailwind classes need to be converted to StyleSheet objects
- NativeWind can handle some Tailwind, but explicit styles are more reliable

### Browser APIs → React Native Equivalents
- `window.REACT_APP_NAVIGATE` → React Navigation's `navigate()`
- `window.history.back()` → `navigation.goBack()`
- `window.open('tel:...')` → `Linking.openURL('tel:...')`
- `window.open('mailto:...')` → `Linking.openURL('mailto:...')`
- `window.print()` → Use PDF generation and sharing
- `document.getElementById()` → Not needed in React Native
- `navigator.share()` → `expo-sharing`
- `navigator.clipboard` → `expo-clipboard` (need to add)

### Icons
- All `ri-*` RemixIcons are mapped to Ionicons via `RemixIcon` utility
- Use `<RemixIcon name="ri-icon-name" />` syntax

### Forms
- HTML form elements → React Native `TextInput` components
- Form submission handled via `onSubmit` handlers
- No native form validation, implement manually

### Modals
- HTML modals → React Native `Modal` component
- Bottom sheets can use React Native modal or third-party library

### Images
- Replace `<img src="..." />` with `<Image source={{ uri: "..." }} />`
- Local images use `require()` instead of paths

### Maps
- Replace `<iframe>` with `react-native-maps` (need to add dependency)
- Or use a web view for Google Maps embedding

### PDF Generation
- jsPDF won't work in React Native
- Use `react-native-pdf` for reading PDFs
- For generating, use `react-native-pdf` or server-side generation

### Scrollable Content
- Use `ScrollView` or `FlatList` for lists
- `ScrollView` for static content
- `FlatList` for dynamic lists with performance optimization

## Additional Dependencies Needed

Add these to package.json:
```json
{
  "expo-clipboard": "~5.1.0",
  "react-native-maps": "1.11.0",
  "@react-native-async-storage/async-storage": "~1.23.0"
}
```

## Testing Notes

- Test all navigation flows
- Test form inputs and validation
- Test image loading
- Test API calls (Supabase, Firebase, Stripe)
- Test location services
- Test sharing functionality
- Test PDF generation and viewing

## Important Reminders

1. All pages need `SafeAreaView` or padding for notches
2. Use `KeyboardAvoidingView` for forms
3. Handle keyboard dismissal properly
4. Test on both iOS and Android
5. Ensure proper spacing with bottom navigation
6. Handle back button behavior on Android
7. Test scroll performance with large lists



