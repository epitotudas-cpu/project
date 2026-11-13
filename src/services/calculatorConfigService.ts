import { useState, useEffect } from 'react';
import { readAppConfig, writeAppConfig } from './appConfigService';

export interface CalculatorConfig {
  concretePricePerM3: number;
  masonryMortarPricePerM2: number;
  insulationPricePerM2: number;
  tilingAdhesivePricePerKg: number;
  drywallBoardPricePerM2: number;
  roofingTilePricePerM2: number;
  laborCostMultiplier: number;
  vatRatePercent: number;
}

export const DEFAULT_CALCULATOR_CONFIG: CalculatorConfig = {
  concretePricePerM3: 32000,
  masonryMortarPricePerM2: 4500,
  insulationPricePerM2: 6800,
  tilingAdhesivePricePerKg: 350,
  drywallBoardPricePerM2: 2200,
  roofingTilePricePerM2: 5400,
  laborCostMultiplier: 1.25,
  vatRatePercent: 27,
};

const STORAGE_KEY = 'epitotudas_calc_config_v1';
const SUPABASE_CALC_ID = '00000000-0000-0000-0000-000000000005';

declare global {
  interface Window {
    __GLOBAL_CALC_CONFIG__?: CalculatorConfig;
  }
}

export function getCalculatorConfig(): CalculatorConfig {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_CALC_CONFIG__) {
      return window.__GLOBAL_CALC_CONFIG__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const config = { ...DEFAULT_CALCULATOR_CONFIG, ...parsed };
      if (typeof window !== 'undefined') window.__GLOBAL_CALC_CONFIG__ = config;
      return config;
    }
  } catch (err) {
    console.error('Hiba a kalkulátor árak olvasásakor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_CALC_CONFIG__ = DEFAULT_CALCULATOR_CONFIG;
  return DEFAULT_CALCULATOR_CONFIG;
}

export function saveCalculatorConfig(config: CalculatorConfig): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_CALC_CONFIG__ = config;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('calc-config-changed'));

    // Cloud sync to Supabase app_configs (with legacy categories fallback)
    void writeAppConfig('__SYSTEM_CONFIG_CALCULATOR_PRICES__', config, {
      id: SUPABASE_CALC_ID,
      slug: 'system-calc-prices-config',
    }).catch((err) => {
      console.warn('Supabase calc config cloud sync info:', err);
    });
  } catch (err) {
    console.error('Hiba a kalkulátor árak mentésekor:', err);
  }
}

export async function fetchCalculatorConfigFromCloud(): Promise<CalculatorConfig | null> {
  try {
    const parsed = await readAppConfig<Partial<CalculatorConfig>>(
      '__SYSTEM_CONFIG_CALCULATOR_PRICES__',
      SUPABASE_CALC_ID
    );
    if (parsed && typeof parsed === 'object') {
      const config = { ...DEFAULT_CALCULATOR_CONFIG, ...parsed };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_CALC_CONFIG__ = config;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        window.dispatchEvent(new Event('calc-config-changed'));
      }
      return config;
    }
  } catch (err) {
    console.warn('Cloud calc config fetch info:', err);
  }
  return null;
}

export function useCalculatorConfig(): CalculatorConfig {
  const [config, setConfig] = useState<CalculatorConfig>(() => getCalculatorConfig());

  useEffect(() => {
    function handleChange() {
      setConfig(getCalculatorConfig());
    }
    handleChange();

    void fetchCalculatorConfigFromCloud().then((cloudConfig) => {
      if (cloudConfig) setConfig(cloudConfig);
    });

    window.addEventListener('calc-config-changed', handleChange);
    return () => window.removeEventListener('calc-config-changed', handleChange);
  }, []);

  return config;
}
