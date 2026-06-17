import React, { useEffect, useRef, useState, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Platform, Text, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hasGoogleMapsApiKey } from '../../utils/maps';

interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  type: 'user' | 'rider' | 'landmark';
  label?: string;
  heading?: number;
}

interface NavigatrMapProps {
  centerLat: number;
  centerLng: number;
  zoom?: number;
  markers?: MapMarker[];
  showRoute?: boolean;
  routeOrigin?: { lat: number; lng: number };
  routeDestination?: { lat: number; lng: number };
  routeCoordinates?: { lat: number; lng: number }[];
  interactive?: boolean;
  fitToMarkers?: boolean;
  height?: number;
  aspectRatio?: number;
  style?: ViewStyle;
  showRadar?: boolean;
  radarTitle?: string;
  radarSubtitle?: string;
  telemetry?: { distance?: string; duration?: string };
  onRegionChangeComplete?: (region: { latitude: number; longitude: number }) => void;
  variant?: 'light' | 'dark';
  showCenterPin?: boolean;
}

export const NavigatrMap: React.FC<NavigatrMapProps> = ({
  centerLat,
  centerLng,
  zoom = 14,
  markers = [],
  showRoute = false,
  routeOrigin,
  routeDestination,
  routeCoordinates,
  interactive = true,
  fitToMarkers = false,
  height,
  aspectRatio = 16 / 9,
  style,
  showRadar = true,
  radarTitle = 'Fleet Radar Active',
  radarSubtitle,
  telemetry,
  onRegionChangeComplete,
  variant = 'light',
  showCenterPin = false,
}) => {
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ),
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    ]).start();
  }, []);

  const region = useMemo(() => {
    // Standard mercator delta: viewport covers ~2 * (360 / 2^zoom) degrees lat at given zoom.
    // zoom 14 → ~0.022°  (~2.4 km),  zoom 15 → ~0.011°,  zoom 16 → ~0.005°,  zoom 17 → ~0.003° (~300 m street-level)
    const latDelta = 360 / Math.pow(2, zoom) * 2;
    const lngDelta = latDelta * 0.5; // typical portrait aspect ratio
    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [centerLat, centerLng, zoom]);

  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const userInteractionTimeout = useRef<any>(null);

  const handleUserInteraction = () => {
    setIsUserInteracting(true);
    if (userInteractionTimeout.current) clearTimeout(userInteractionTimeout.current);
    userInteractionTimeout.current = setTimeout(() => setIsUserInteracting(false), 5000);
  };

  const reCenter = () => {
    if (!mapRef.current) return;
    if (markers.length > 0) {
      const coords = markers.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng)).map(m => ({ latitude: m.lat, longitude: m.lng }));
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true });
      }
    } else if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      mapRef.current.animateToRegion(region, 1000);
    }
    setIsUserInteracting(false);
  };

  const markersHash = useMemo(() => JSON.stringify(markers.map(m => `${m.id}-${m.lat}-${m.lng}`)), [markers]);

  useEffect(() => {
    if (fitToMarkers && markers.length > 0 && mapRef.current && !isUserInteracting) {
      const coords = markers.filter(m => Number.isFinite(m.lat) && Number.isFinite(m.lng)).map(m => ({ latitude: m.lat, longitude: m.lng }));
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, { edgePadding: { top: 140, right: 80, bottom: 140, left: 80 }, animated: true });
      }
    }
  }, [markersHash, fitToMarkers, isUserInteracting]);

  useEffect(() => {
    if (mapRef.current && Number.isFinite(centerLat) && Number.isFinite(centerLng) && !isUserInteracting && !fitToMarkers) {
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [centerLat, centerLng, region, isUserInteracting, fitToMarkers]);

  const routeLine = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length >= 2) {
      return routeCoordinates.map(point => ({ latitude: point.lat, longitude: point.lng }));
    }
    if (showRoute && routeOrigin && routeDestination) {
      return [
        { latitude: routeOrigin.lat, longitude: routeOrigin.lng },
        { latitude: routeDestination.lat, longitude: routeDestination.lng },
      ];
    }
    return null;
  }, [routeCoordinates, showRoute, routeOrigin, routeDestination]);

  const handleRegionChangeComplete = (nextRegion: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number }) => {
    onRegionChangeComplete?.({ latitude: nextRegion.latitude, longitude: nextRegion.longitude });
  };

  const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

  const flatStyle = StyleSheet.flatten(style);
  const hasHeightOrFlex = flatStyle && (flatStyle.height !== undefined || flatStyle.flex !== undefined);
  const resolvedHeight = height ?? (containerWidth > 0 ? containerWidth / aspectRatio : 200);
  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scanTranslate = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 400] });

  const isDark = variant === 'dark';

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, isDark && styles.containerDark, !hasHeightOrFlex && { height: resolvedHeight }, style]}>
        <View style={styles.webFallback}>
          <RemixIcon name="ri-map-2-line" size={36} color="#10b981" />
          <Text style={[styles.webFallbackTitle, isDark && styles.webFallbackTitleDark]}>Map preview unavailable on web</Text>
          <Text style={styles.webFallbackCoords}>
            {centerLat.toFixed(5)}, {centerLng.toFixed(5)}
          </Text>
          {markers.length > 0 && (
            <Text style={styles.webFallbackMeta}>{markers.length} location{markers.length !== 1 ? 's' : ''} tracked</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.container, 
        isDark && styles.containerDark, 
        !hasHeightOrFlex && { height: resolvedHeight }, 
        style
      ]} 
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <MapView
        ref={mapRef}
        style={[styles.map, StyleSheet.absoluteFillObject]}
        provider={mapProvider}
        initialRegion={region}
        showsUserLocation={false}
        showsPointsOfInterest={false}
        showsCompass={false}
        showsBuildings={true}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        onPanDrag={handleUserInteraction}
        onTouchStart={handleUserInteraction}
        onRegionChangeComplete={handleRegionChangeComplete}
        customMapStyle={isDark ? darkMapConfig : []}
      >

        {markers.map((marker, index) => (
          <Marker key={marker.id || `m-${index}`} coordinate={{ latitude: marker.lat, longitude: marker.lng }} anchor={{ x: 0.5, y: 0.5 }} flat={marker.type === 'rider'} rotation={marker.heading}>
            <View style={styles.markerWrapper}>
               <Animated.View style={[styles.glowCircle, styles[`glow_${marker.type}`], { 
                 transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] }) }],
                 opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] })
               }]} />
               <View style={[styles.markerPin, styles[`marker_${marker.type}`]]}>
                  <RemixIcon 
                    name={
                      marker.type === 'rider' 
                        ? 'ri-moped-fill' 
                        : (marker.type === 'user' ? 'ri-home-4-fill' : 'ri-delete-bin-6-fill')
                    } 
                    size={16} 
                    color="#fff" 
                  />
               </View>
               {marker.label && (
                 <View style={[styles.labelBox, isDark && styles.labelBoxDark]}><Text style={[styles.labelText, isDark && styles.labelTextDark]}>{marker.label}</Text></View>
               )}
            </View>
          </Marker>
        ))}

        {routeLine && (
          <>
            <Polyline coordinates={routeLine} strokeColor="rgba(16, 185, 129, 0.25)" strokeWidth={7} />
            <Polyline coordinates={routeLine} strokeColor="#10b981" strokeWidth={3.5} />
          </>
        )}
      </MapView>

      {Platform.OS === 'android' && !hasGoogleMapsApiKey && (
        <View style={styles.mapWarning} pointerEvents="none">
          <RemixIcon name="ri-error-warning-line" size={16} color="#92400e" />
          <Text style={styles.mapWarningText}>Google Maps API key is missing. Map tiles and Google search may not load.</Text>
        </View>
      )}

      {/* Center Pin Logic moved inside NavigatrMap */}
      {showCenterPin && (
        <View style={styles.centerPinOverlay} pointerEvents="none">
           <View style={styles.pinShadow} />
           <View style={styles.pinIconWrapper}>
              <RemixIcon name="ri-map-pin-user-fill" size={32} color="#10b981" />
           </View>
        </View>
      )}

      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
         <View style={[styles.vignette, isDark && styles.vignetteDark]} />
         <Animated.View style={[styles.scanLine, isDark && styles.scanLineDark, { transform: [{ translateY: scanTranslate }] }]} />
      </View>

      {showRadar && (
        <View style={[styles.hudOverlay, { top: Math.max(insets.top, 20) }]}>
          <View style={[styles.radarStatus, isDark && styles.radarStatusDark]}>
            <View style={[styles.radarIconBox, isDark && styles.radarIconBoxDark]}>
               <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                  <RemixIcon name="ri-radar-fill" size={20} color="#10b981" />
               </Animated.View>
            </View>
            <View>
              <Text style={[styles.radarText, isDark && styles.radarTextDark]}>{radarTitle}</Text>
              <Text style={styles.radarSubtitle}>{radarSubtitle || 'SECURE DATA LINK ACTIVE'}</Text>
            </View>
          </View>
          
          <View style={styles.telemetryHUD}>
            {telemetry && (
              <View style={[styles.glassCard, isDark && styles.glassCardDark]}>
                 <View style={styles.teleItem}>
                    <Text style={styles.teleLabel}>ETA</Text>
                    <Text style={[styles.teleValue, isDark && styles.teleValueDark]}>{telemetry.duration || '--'}</Text>
                 </View>
                 <View style={[styles.teleDivider, isDark && styles.teleDividerDark]} />
                 <View style={styles.teleItem}>
                    <Text style={styles.teleLabel}>DIST</Text>
                    <Text style={[styles.teleValue, isDark && styles.teleValueDark]}>{telemetry.distance || '--'}</Text>
                 </View>
              </View>
            )}

            {isUserInteracting && (
              <TouchableOpacity onPress={reCenter} style={[styles.reCenterBtn, isDark && styles.reCenterBtnDark]} activeOpacity={0.8}>
                <RemixIcon name="ri-focus-3-fill" size={22} color="#10b981" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const darkMapConfig = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: '#F1F5F9' },
  containerDark: { backgroundColor: '#020617' },
  map: { width: '100%' },
  mapWarning: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '92%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 251, 235, 0.96)',
    borderWidth: 1,
    borderColor: '#fcd34d',
    zIndex: 20,
  },
  mapWarningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#92400e',
  },
  markerWrapper: { alignItems: 'center', justifyContent: 'center', width: 80, height: 80 },
  glowCircle: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  glow_user: { backgroundColor: 'rgba(13, 148, 136, 0.4)' },
  glow_rider: { backgroundColor: 'rgba(16, 185, 129, 0.4)' },
  glow_landmark: { backgroundColor: 'rgba(245, 158, 11, 0.4)' },
  markerPin: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6
  },
  marker_user: { backgroundColor: '#0d9488' },
  marker_rider: { backgroundColor: '#10b981' },
  marker_landmark: { backgroundColor: '#f59e0b' },
  labelBox: {
    position: 'absolute', bottom: 5, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3
  },
  labelBoxDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  labelText: { color: '#0f172a', fontSize: 8, fontFamily: typography.bold, textTransform: 'uppercase' },
  labelTextDark: { color: '#f1f5f9' },
  vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', borderWidth: 40, borderColor: 'rgba(15, 23, 42, 0.03)' },
  vignetteDark: { borderColor: 'rgba(0, 0, 0, 0.4)' },
  scanLine: { width: '100%', height: 2, backgroundColor: 'rgba(16, 185, 129, 0.1)', position: 'absolute' },
  scanLineDark: { backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  hudOverlay: { position: 'absolute', top: 20, left: 16, right: 16, gap: 12 },
  radarStatus: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
  },
  radarStatusDark: { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' },
  radarIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  radarIconBoxDark: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  radarText: { color: '#0f172a', fontSize: 10, fontFamily: typography.bold, letterSpacing: 0.5 },
  radarTextDark: { color: '#f1f5f9' },
  radarSubtitle: { color: '#10b981', fontSize: 7, fontFamily: typography.bold, marginTop: 1 },
  telemetryHUD: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  glassCard: {
    flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18, gap: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
  },
  glassCardDark: { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)' },
  reCenterBtn: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
  },
  reCenterBtnDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
  teleItem: { alignItems: 'center' },
  teleLabel: { fontSize: 8, fontFamily: typography.bold, color: '#94a3b8' },
  teleValue: { fontSize: 13, fontFamily: typography.bold, color: '#0f172a', marginTop: 2 },
  teleValueDark: { color: '#f1f5f9' },
  teleDivider: { width: 1, height: 24, backgroundColor: '#f1f5f9' },
  teleDividerDark: { backgroundColor: '#334155' },
  centerPinOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinIconWrapper: {
    transform: [{ translateY: -4 }],
  },
  pinShadow: {
    width: 6,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    position: 'absolute',
    bottom: -2,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: '#ecfdf5',
  },
  webFallbackTitle: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#0f172a',
    textAlign: 'center',
  },
  webFallbackTitleDark: { color: '#f1f5f9' },
  webFallbackCoords: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#64748b',
  },
  webFallbackMeta: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#10b981',
    marginTop: 4,
  },
});
