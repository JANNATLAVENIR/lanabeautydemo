import React from 'react';
import { HomepageSettings } from '../../types';
import { ExecutiveSettingsManager } from './ExecutiveSettingsManager';

export interface SocialWhatsAppManagerProps {
  homepageSettings?: HomepageSettings;
  onSaveHomepageSettings: (settings: any) => Promise<void>;
  onRefresh?: () => void;
  adminEmail?: string;
  onNavigateTab?: (tab: string) => void;
}

export function SocialWhatsAppManager(props: SocialWhatsAppManagerProps) {
  return <ExecutiveSettingsManager {...props} />;
}

export { ExecutiveSettingsManager };
