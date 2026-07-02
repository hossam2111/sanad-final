import { useState, useEffect } from 'react';

export interface RegionConfig {
  id: string;
  countryName: string;
  countryNameEn: string;
  ministryName: string;
  ministryNameEn: string;
  idLabel: string;
  idLabelEn: string;
  currency: string;
  currencyEn: string;
  flag: string;
}

export const REGIONS: Record<string, RegionConfig> = {
  KSA: {
    id: 'KSA',
    countryName: 'المملكة العربية السعودية',
    countryNameEn: 'Saudi Arabia',
    ministryName: 'وزارة الصحة',
    ministryNameEn: 'Ministry of Health',
    idLabel: 'الهوية الوطنية',
    idLabelEn: 'National ID',
    currency: 'ر.س',
    currencyEn: 'SAR',
    flag: '🇸🇦',
  },
  QATAR: {
    id: 'QATAR',
    countryName: 'دولة قطر',
    countryNameEn: 'Qatar',
    ministryName: 'وزارة الصحة العامة',
    ministryNameEn: 'Ministry of Public Health',
    idLabel: 'الرقم الشخصي (QID)',
    idLabelEn: 'Qatar ID (QID)',
    currency: 'ر.ق',
    currencyEn: 'QAR',
    flag: '🇶🇦',
  },
  UAE: {
    id: 'UAE',
    countryName: 'الإمارات العربية المتحدة',
    countryNameEn: 'United Arab Emirates',
    ministryName: 'وزارة الصحة ووقاية المجتمع',
    ministryNameEn: 'Ministry of Health & Prevention',
    idLabel: 'الهوية الإماراتية',
    idLabelEn: 'Emirates ID',
    currency: 'د.إ',
    currencyEn: 'AED',
    flag: '🇦🇪',
  },
  OMAN: {
    id: 'OMAN',
    countryName: 'سلطنة عمان',
    countryNameEn: 'Oman',
    ministryName: 'وزارة الصحة',
    ministryNameEn: 'Ministry of Health',
    idLabel: 'الرقم المدني',
    idLabelEn: 'Civil Number',
    currency: 'ر.ع.',
    currencyEn: 'OMR',
    flag: '🇴🇲',
  },
  KUWAIT: {
    id: 'KUWAIT',
    countryName: 'دولة الكويت',
    countryNameEn: 'Kuwait',
    ministryName: 'وزارة الصحة',
    ministryNameEn: 'Ministry of Health',
    idLabel: 'الرقم المدني',
    idLabelEn: 'Civil ID',
    currency: 'د.ك',
    currencyEn: 'KWD',
    flag: '🇰🇼',
  },
  BAHRAIN: {
    id: 'BAHRAIN',
    countryName: 'مملكة البحرين',
    countryNameEn: 'Bahrain',
    ministryName: 'وزارة الصحة',
    ministryNameEn: 'Ministry of Health',
    idLabel: 'الرقم الشخصي',
    idLabelEn: 'Personal Number (CPR)',
    currency: 'د.ب',
    currencyEn: 'BHD',
    flag: '🇧🇭',
  },
  GENERIC: {
    id: 'GENERIC',
    countryName: 'النظام الصحي الموحد',
    countryNameEn: 'Unified Health System',
    ministryName: 'الهيئة الصحية',
    ministryNameEn: 'Health Authority',
    idLabel: 'الرقم التعريفي',
    idLabelEn: 'Identifier',
    currency: 'دولار',
    currencyEn: 'USD',
    flag: '🌍',
  }
};

export function useRegionStore() {
  const [regionId, setRegionId] = useState<string>('KSA');

  useEffect(() => {
    // Read initial value
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sanad_region_id');
      if (stored && REGIONS[stored]) {
        setRegionId(stored);
      }
    }

    // Listen for changes from other tabs or components
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent && e.key === 'sanad_region_id') {
        if (e.newValue && REGIONS[e.newValue]) {
          setRegionId(e.newValue);
        }
      } else if (e instanceof CustomEvent && e.type === 'sanad_region_changed') {
        const newVal = localStorage.getItem('sanad_region_id');
        if (newVal && REGIONS[newVal]) {
          setRegionId(newVal);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sanad_region_changed', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sanad_region_changed', handleStorageChange as EventListener);
    };
  }, []);

  const changeRegion = (newRegionId: string) => {
    if (REGIONS[newRegionId]) {
      setRegionId(newRegionId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sanad_region_id', newRegionId);
        window.dispatchEvent(new CustomEvent('sanad_region_changed'));
      }
    }
  };

  const config = REGIONS[regionId] || REGIONS['KSA']!;

  return { regionId, config, changeRegion, regions: REGIONS };
}
