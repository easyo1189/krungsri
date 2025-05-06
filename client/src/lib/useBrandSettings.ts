import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Define type for withdrawal page settings
export interface WithdrawalPageSettings {
  balanceCardBgFrom: string;
  balanceCardBgTo: string;
  balanceCardTextColor: string;
  tabActiveColor: string;
  tabTextColor: string;
  bankFormHeaderBgFrom: string;
  bankFormHeaderBgTo: string;
  withdrawFormHeaderBgFrom: string;
  withdrawFormHeaderBgTo: string;
  bankButtonBgFrom: string;
  bankButtonBgTo: string;
  bankButtonTextColor: string;
  withdrawButtonBgFrom: string;
  withdrawButtonBgTo: string;
  withdrawButtonTextColor: string;
}

// Define colors settings type
export interface ColorsSettings {
  headerBackground: string;
  headerText: string;
  primaryButtonBackground: string;
  primaryButtonText: string;
  secondaryButtonBackground: string;
  secondaryButtonText: string;
  bottomNavigationBackground: string;
  bottomNavigationText: string;
  bottomNavigationActiveText: string;
  bottomNavigationActiveIcon: string;
  bottomNavigationBorder: string;
  cardBackground: string;
  cardBorder: string;
  cardHeaderBackground: string;
  cardTitle: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

// Define type for all brand settings
export interface BrandSettings {
  siteName: string;
  logoUrl: string;
  siteDescription: string;
  footerText: string;
  login: {
    logoIcon: string;
    mainTitle: string;
    subTitle: string;
    backgroundColor: string;
    headerText: string;
    buttonColor: string;
    buttonTextColor: string;
  };
  withdrawalPage?: WithdrawalPageSettings;
  homePage?: any;
  loanPage?: any;
  fonts?: any;
  colors?: ColorsSettings;
}

// Default withdrawal page settings
const defaultWithdrawalSettings: WithdrawalPageSettings = {
  balanceCardBgFrom: '#10b981',
  balanceCardBgTo: '#059669',
  balanceCardTextColor: '#ffffff',
  tabActiveColor: '#10b981',
  tabTextColor: '#4b5563',
  bankFormHeaderBgFrom: '#e6f7f7',
  bankFormHeaderBgTo: '#e6f0ff',
  withdrawFormHeaderBgFrom: '#e6f7f7',
  withdrawFormHeaderBgTo: '#e6f0ff',
  bankButtonBgFrom: '#3b82f6',
  bankButtonBgTo: '#2563eb',
  bankButtonTextColor: '#ffffff',
  withdrawButtonBgFrom: '#10b981', 
  withdrawButtonBgTo: '#059669',
  withdrawButtonTextColor: '#ffffff'
};

export function useBrandSettings() {
  const { data: brandSettings, isLoading, error } = useQuery<BrandSettings>({
    queryKey: ['/api/settings/brand'],
  });
  
  // Apply CSS variables based on withdrawal page settings
  useEffect(() => {
    if (brandSettings) {
      const withdrawalSettings = brandSettings.withdrawalPage || defaultWithdrawalSettings;
      
      // Set CSS variables for withdrawal page
      document.documentElement.style.setProperty(
        '--withdrawal-balance-card-gradient',
        `linear-gradient(to right, ${withdrawalSettings.balanceCardBgFrom}, ${withdrawalSettings.balanceCardBgTo})`
      );
      document.documentElement.style.setProperty(
        '--withdrawal-balance-text-color',
        withdrawalSettings.balanceCardTextColor
      );
      document.documentElement.style.setProperty(
        '--withdrawal-tab-active-color',
        withdrawalSettings.tabActiveColor
      );
      document.documentElement.style.setProperty(
        '--withdrawal-tab-text-color',
        withdrawalSettings.tabTextColor
      );
      document.documentElement.style.setProperty(
        '--withdrawal-bank-form-header-gradient',
        `linear-gradient(to right, ${withdrawalSettings.bankFormHeaderBgFrom}, ${withdrawalSettings.bankFormHeaderBgTo})`
      );
      document.documentElement.style.setProperty(
        '--withdrawal-withdraw-form-header-gradient',
        `linear-gradient(to right, ${withdrawalSettings.withdrawFormHeaderBgFrom}, ${withdrawalSettings.withdrawFormHeaderBgTo})`
      );
      document.documentElement.style.setProperty(
        '--withdrawal-bank-button-gradient',
        `linear-gradient(to right, ${withdrawalSettings.bankButtonBgFrom}, ${withdrawalSettings.bankButtonBgTo})`
      );
      document.documentElement.style.setProperty(
        '--withdrawal-bank-button-text-color',
        withdrawalSettings.bankButtonTextColor
      );
      document.documentElement.style.setProperty(
        '--withdrawal-withdraw-button-gradient',
        `linear-gradient(to right, ${withdrawalSettings.withdrawButtonBgFrom}, ${withdrawalSettings.withdrawButtonBgTo})`
      );
      document.documentElement.style.setProperty(
        '--withdrawal-withdraw-button-text-color',
        withdrawalSettings.withdrawButtonTextColor
      );
      
      // Log for debugging
      console.log('Brand settings loaded:', brandSettings);
    }
  }, [brandSettings]);
  
  return {
    brandSettings,
    isLoading,
    error,
    defaultWithdrawalSettings
  };
}

export default useBrandSettings;