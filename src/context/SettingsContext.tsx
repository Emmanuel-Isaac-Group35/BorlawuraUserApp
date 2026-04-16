import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SettingsContextType {
  settings: any;
  loading: boolean;
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
      
      // Attempt 1: New CMS Studio Structure
      let { data: cms } = await supabase.from('system_settings').select('settings').eq('id', 'cms_config_v3').maybeSingle();
      
      // Attempt 2: Support for older 'v2' if 'v3' is somehow bypassed
      if (!cms) {
        const { data: v2 } = await supabase.from('system_settings').select('settings').eq('id', 'cms_config_v2').maybeSingle();
        cms = v2;
      }

      const cs = cms?.settings?.user;

      // Attempt 3: Legacy Global Config
      const { data: legacy } = await supabase.from('system_settings').select('settings').eq('id', 'global_config').maybeSingle();
      const ls = legacy?.settings?.mobileApp || legacy?.settings;

      const final = {
        mobileApp: {
          headerTitle: cs?.headerTitle || ls?.headerTitle || 'Borla Wura',
          headerTagline: cs?.headerTagline || ls?.headerTagline || 'Eco-friendly Pickups',
          popupActive: cs?.announcement?.enabled ?? ls?.popupActive ?? false,
          popupTitle: cs?.announcement?.title || ls?.popupTitle || 'Welcome back!',
          popupMessage: cs?.announcement?.message || ls?.popupMessage || 'Check out our new recycling initiatives!',
          popupImage: cs?.announcement?.image || ls?.popupImage || '',
          newsItems: (cs?.banners?.length > 0)
            ? cs.banners.map((b: any) => ({ 
                id: b.id, 
                title: b.title, 
                content: b.subtitle, 
                image: b.image 
              }))
            : (ls?.newsItems || [])
        }
      };

      setSettings(final);
    } catch (e) {
      console.error('Critical sync failure:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
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
