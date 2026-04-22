import React, { useEffect, useRef, useMemo, useState } from 'react';
import { StyleSheet, View, ViewStyle, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Marker {
  lat: number;
  lng: number;
  type: 'user' | 'rider' | 'landmark';
  label?: string;
}

interface NavigatrMapProps {
  centerLat: number;
  centerLng: number;
  zoom?: number;
  markers?: Marker[];
  showRoute?: boolean;
  routeOrigin?: { lat: number; lng: number };
  routeDestination?: { lat: number; lng: number };
  interactive?: boolean;
  /** Explicit pixel height. If omitted, uses aspectRatio to compute from width. */
  height?: number;
  /** Width-to-height ratio used when height is not specified. Default 16/9. */
  aspectRatio?: number;
  style?: ViewStyle;
}

export const NavigatrMap: React.FC<NavigatrMapProps> = ({
  centerLat,
  centerLng,
  zoom = 14,
  markers = [],
  showRoute = false,
  routeOrigin,
  routeDestination,
  interactive = true,
  height,
  aspectRatio = 16 / 9,
  style,
}) => {
  const webviewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Freeze initial config into a ref so the HTML is only generated once.
  // Marker updates are pushed via postMessage without reloading the map.
  const cfg = useRef({ centerLat, centerLng, zoom, interactive, showRoute, routeOrigin, routeDestination });

  const mapHtml = useMemo(() => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f1f5f9; }
    #map { width: 100%; height: 100%; }

    /* ── Loading splash ── */
    #loader {
      position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #f8fafc; z-index: 999;
      gap: 12px; transition: opacity 0.4s ease;
    }
    #loader.hide { opacity: 0; pointer-events: none; }
    .loader-icon {
      width: 52px; height: 52px; border-radius: 16px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; box-shadow: 0 8px 24px rgba(16,185,129,0.3);
      animation: float 2s ease-in-out infinite;
    }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .loader-text { font-size: 13px; font-weight: 600; color: #64748b; font-family: system-ui, sans-serif; }
    .loader-bar { width: 120px; height: 3px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
    .loader-bar-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); width: 0%; animation: fill-bar 2s ease-in-out forwards; }
    @keyframes fill-bar { 0% { width: 0%; } 70% { width: 85%; } 100% { width: 100%; } }

    /* ── Marker styles ── */
    .marker-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
    .pulse {
      position: absolute; border-radius: 50%;
      animation: pulse-ring 2s cubic-bezier(0.215,0.61,0.355,1) infinite;
      pointer-events: none;
    }
    .pulse-user  { width: 56px; height: 56px; background: rgba(16,185,129,0.2); }
    .pulse-rider { width: 64px; height: 64px; background: rgba(59,130,246,0.2); animation-duration: 2.5s; }
    @keyframes pulse-ring {
      0%   { transform: scale(0.55); opacity: 0.85; }
      100% { transform: scale(2);    opacity: 0; }
    }

    .marker-pin {
      width: 34px; height: 34px; border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; position: relative; z-index: 1;
      transition: transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275);
      cursor: pointer;
    }
    .marker-pin:hover { transform: scale(1.15); }
    .marker-user     { background: linear-gradient(145deg,#10b981,#059669); }
    .marker-rider    { background: #fff; width: 40px; height: 40px; font-size: 20px; border: 2.5px solid #3b82f6; box-shadow: 0 8px 20px rgba(59,130,246,0.28); }
    .marker-landmark { background: linear-gradient(145deg,#f59e0b,#d97706); width: 28px; height: 28px; font-size: 13px; }

    /* ── Tooltip label ── */
    .label {
      position: absolute; bottom: 46px; left: 50%; transform: translateX(-50%);
      background: rgba(15,23,42,0.92); color: #fff;
      padding: 5px 11px; border-radius: 9px;
      font-size: 11px; font-weight: 700; white-space: nowrap;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); backdrop-filter: blur(6px);
      pointer-events: none;
    }
    .label::after {
      content: ''; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
      border: 5px solid transparent; border-top-color: rgba(15,23,42,0.92);
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div id="loader">
    <div class="loader-icon">🗺️</div>
    <div class="loader-bar"><div class="loader-bar-fill"></div></div>
    <div class="loader-text">Loading Map…</div>
  </div>
  <div id="map"></div>
  <script type="module">
    import { Navigatr } from 'https://esm.sh/@navigatr/web@1.3.0';

    const loader = document.getElementById('loader');
    let map = null;
    let currentMarkers = [];

    function buildMarkerHtml(m) {
      const icon = m.type === 'rider' ? '🛺' : (m.type === 'landmark' ? '🏢' : '');
      return \`
        <div class="marker-wrap">
          <div class="pulse pulse-\${m.type}"></div>
          <div class="marker-pin marker-\${m.type}">\${icon}</div>
          \${m.label ? \`<div class="label">\${m.label}</div>\` : ''}
        </div>
      \`;
    }

    function clearMarkers() {
      currentMarkers.forEach(m => { try { if (m && typeof m.remove === 'function') m.remove(); } catch(e){} });
      currentMarkers = [];
    }

    function addMarkers(markersData) {
      clearMarkers();
      (markersData || []).forEach(m => {
        if (!m || typeof m.lat !== 'number' || typeof m.lng !== 'number') return;
        try {
          const marker = map.addMarker({ lat: m.lat, lng: m.lng, iconHtml: buildMarkerHtml(m) });
          currentMarkers.push(marker);
        } catch(e) {}
      });
    }

    window.updateMapState = (data) => {
      if (!map) return;
      if (data && Array.isArray(data.markers)) addMarkers(data.markers);
    };

    // Bridge for React Native WebView & Web iframe
    window.addEventListener('message', (event) => {
      let payload = event.data;
      try { if (typeof payload === 'string') payload = JSON.parse(payload); } catch(e) {}
      if (payload && payload.type === 'UPDATE_MAP') window.updateMapState(payload.data);
    });

    async function init() {
      try {
        const nav = new Navigatr();
        map = nav.map({
          container: 'map',
          center: { lat: ${cfg.current.centerLat}, lng: ${cfg.current.centerLng} },
          zoom: ${cfg.current.zoom},
          pitch: ${cfg.current.interactive ? 45 : 30},
          bearing: -10,
          interactive: ${cfg.current.interactive},
        });

        window.navigatrMap = map;

        // Hide loader after map tiles load
        setTimeout(() => {
          if (loader) loader.classList.add('hide');
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
          }
        }, 1400);

        // Draw route if needed
        if (${cfg.current.showRoute} && ${!!cfg.current.routeOrigin} && ${!!cfg.current.routeDestination}) {
          try {
            const route = await nav.route({
              origin:      { lat: ${cfg.current.routeOrigin?.lat ?? 0}, lng: ${cfg.current.routeOrigin?.lng ?? 0} },
              destination: { lat: ${cfg.current.routeDestination?.lat ?? 0}, lng: ${cfg.current.routeDestination?.lng ?? 0} },
              mode: 'drive',
            });
            if (route && route.polyline) {
              map.drawRoute(route.polyline, { color: '#10b981', weight: 5, opacity: 0.85 });
              map.fitRoute(route.polyline);
            }
          } catch(e) {}
        }

      } catch(e) {
        if (loader) {
          loader.innerHTML = \`<div style="text-align:center;padding:20px;font-family:system-ui">
            <div style="font-size:32px;margin-bottom:8px">⚠️</div>
            <div style="color:#ef4444;font-weight:700;font-size:13px">Map failed to load</div>
            <div style="color:#94a3b8;font-size:11px;margin-top:4px">Check your connection</div>
          </div>\`;
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>`, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time marker sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    const payload = JSON.stringify({ type: 'UPDATE_MAP', data: { markers } });

    if (Platform.OS === 'web') {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_MAP', data: { markers } }, '*');
      }
    } else if (webviewRef.current) {
      // injectJavaScript must return true
      const script = `(function(){ if(window.updateMapState){ window.updateMapState(${JSON.stringify({ markers })}); } })(); true;`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [markers]);

  // ── Delayed first injection for web (iframe loads async) ─────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const t = setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'UPDATE_MAP', data: { markers } }, '*');
      }
    }, 1600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resolve final pixel height responsively ───────────────────────────────
  // Priority: explicit style.height > explicit height prop > aspect-ratio from measured width
  const styleHeight = (style as any)?.height;
  const resolvedHeight: number | undefined =
    styleHeight ?? height ?? (containerWidth > 0 ? Math.round(containerWidth / aspectRatio) : undefined);

  return (
    <View
      style={[styles.container, resolvedHeight ? { height: resolvedHeight } : {}, style]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== containerWidth) setContainerWidth(w);
      }}
    >
      {!resolvedHeight ? null : (
        <>

      {hasError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Map unavailable</Text>
          <Text style={styles.errorSub}>Check your internet connection</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: interactive ? 'auto' : 'none',
          }}
          title="Live Rider Map"
        />
      ) : (
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: mapHtml }}
          style={styles.webview}
          scrollEnabled={interactive}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onError={() => { setHasError(true); }}
        />
      )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 24,
  },
  errorEmoji: { fontSize: 32, marginBottom: 8 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#ef4444', marginBottom: 4 },
  errorSub: { fontSize: 12, color: '#94a3b8' },
});
