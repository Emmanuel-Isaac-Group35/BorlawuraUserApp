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

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('public:system_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // 1. Concurrent Fetch: Get data from all possible cloud nodes
      const [v3Res, legacyRes] = await Promise.all([
        supabase.from('system_settings').select('settings').eq('id', 'cms_config_v3').maybeSingle(),
        supabase.from('system_settings').select('settings').eq('id', 'global_config').maybeSingle()
      ]);

      const cs = v3Res.data?.settings?.user;
      const ld = legacyRes.data?.settings || {};
      const ls = ld.mobileApp || ld;

      // 2. Intelligence Merge: Prioritize v3 but fallback to global for each specific field
      const final = {
        maintenanceMode: cs?.maintenanceMode ?? ld?.maintenance_mode ?? false,
        contact: {
          phone: cs?.support?.phone || ld?.contact_phone || '+233 30 000 0000',
          email: cs?.support?.email || ld?.contact_email || 'support@borlawura.com',
          whatsapp: cs?.support?.whatsapp || ld?.contact_whatsapp || '+233 24 000 0000',
        },
        mobileApp: {
          headerTitle: cs?.headerTitle || ls?.headerTitle || 'Borla Wura',
          headerTagline: cs?.headerTagline || ls?.headerTagline || 'Clean. Green. Simple.',
          popupActive: cs?.announcement?.enabled ?? ls?.popupActive ?? false,
          popupTitle: cs?.announcement?.title || ls?.popupTitle || '',
          popupMessage: cs?.announcement?.message || ls?.popupMessage || '',
          popupImage: cs?.announcement?.image || ls?.popupImage || '',
          // Aggressive asset extraction: Check banners, sliders, and legacy news items
          newsItems: [
            ...(cs?.banners || []),
            ...(cs?.sliders || []),
            ...(ls?.newsItems || [])
          ].filter(Boolean).map((b: any, index: number) => ({ 
            id: b.id ? `ni-${index}-${b.id}` : `node-${index}`, 
            title: b.title || 'Official Update', 
            content: b.subtitle || b.content || b.description || '', 
            image: b.image || b.imageUrl || b.bannerImage,
            category: b.category || 'Promo',
            action_type: b.action_type || 'route',
            action_value: b.action_value || '/booking'
          }))
        }
      };

      setSettings(final);
    } catch (e) {
      console.error('Settings Refresh Protocol Failed:', e);
    } finally {
      setLoading(false);
    }
  };

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
