import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SettingsContextType {
  settings: any;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      console.log("📡 Syncing with CMS Studio...");
      
      // Fetch the latest config from v3 (Current Enterprise Standard)
      const { data: cms, error: cmsError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 'cms_config_v3')
        .maybeSingle();

      if (cmsError) console.error("CMS Fetch Error:", cmsError);

      // Deep dive into the settings object
      // Data might be in .settings.user or just .settings
      const raw = cms?.settings || {};
      const cs = raw.user || raw; 

      // Fallback to legacy only if v3 is completely empty
      const { data: legacy } = await supabase.from('system_settings').select('settings').eq('id', 'global_config').maybeSingle();
      const ld = legacy?.settings || {};
      const ls = ld.mobileApp || ld;

      const final = {
        maintenanceMode: cs?.maintenanceMode ?? ld?.maintenance_mode ?? false,
        contact: {
          phone: cs?.support?.phone || cs?.contactPhone || ld?.contact_phone || '+233 30 000 0000',
          email: cs?.support?.email || cs?.contactEmail || ld?.contact_email || 'support@borlawura.com',
          whatsapp: cs?.support?.whatsapp || cs?.contactWhatsapp || ld?.contact_whatsapp || '+233 24 000 0000',
        },
        mobileApp: {
          headerTitle: cs?.headerTitle || ls?.headerTitle || 'Borla Wura',
          headerTagline: cs?.headerTagline || ls?.headerTagline || 'Clean. Green. Simple.',
          popupActive: cs?.announcement?.enabled ?? cs?.popupActive ?? ls?.popupActive ?? false,
          popupTitle: cs?.announcement?.title || cs?.popupTitle || '',
          popupMessage: cs?.announcement?.message || cs?.popupMessage || '',
          popupImage: cs?.announcement?.image || cs?.popupImage || '',
          newsItems: (cs?.banners?.length > 0 || cs?.sliders?.length > 0 || cs?.newsItems?.length > 0)
            ? [...(cs.banners || []), ...(cs.sliders || []), ...(cs.newsItems || [])].map((b: any, idx: number) => ({ 
                id: b.id || `cms-${idx}`, 
                title: b.title || 'Official Update', 
                content: b.subtitle || b.content || b.description || 'Welcome to Borla Wura', 
                image: b.image || b.imageUrl || 'https://readdy.ai/api/search-image?query=clean%20city%20modern&width=500&height=250',
                category: b.category || 'Official',
                action_type: b.action_type || 'route',
                action_value: b.action_value || '/booking'
              }))
            : (ls?.newsItems || [])
        }
      };

      console.log("✅ CMS Sync Complete:", final.mobileApp.newsItems.length, "items loaded.");
      setSettings(final);
    } catch (e) {
      console.error('Critical sync failure:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Enhanced Real-time Listener for ANY setting change
    const channel = supabase
      .channel('cms-sync-stream')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'system_settings' 
      }, (payload) => {
        console.log("🔔 CMS Update Received:", payload.new.id);
        fetchSettings();
      })
      .subscribe((status) => {
        console.log("🌐 Sync Channel Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
