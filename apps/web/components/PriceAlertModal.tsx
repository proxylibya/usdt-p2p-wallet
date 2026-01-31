import React, { useState } from 'react';
import { Modal } from './Modal';
import { WALLETS } from '../constants';
import { PriceAlert, Wallet } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { Trash2 } from 'lucide-react';
import { SelectField } from './SelectField';
import { SelectModal } from './SelectModal';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  onSetAlert: (assetSymbol: PriceAlert['assetSymbol'], targetPrice: number) => void;
  onDeleteAlert: (alertId: string) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onSetAlert,
  onDeleteAlert,
}) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { symbol, convertSelectedCurrencyToUsd, formatCurrency } = useCurrency();
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<PriceAlert['assetSymbol']>('USDT');
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  const selectedAsset = WALLETS.find(w => w.symbol === selectedAssetSymbol);

  const handleSetAlert = () => {
    const priceInSelectedCurrency = parseFloat(targetPrice);
    if (!priceInSelectedCurrency || priceInSelectedCurrency <= 0 || !selectedAssetSymbol) return;

    // Convert the target price back to USD to store it consistently
    const priceInUsd = convertSelectedCurrencyToUsd(priceInSelectedCurrency);

    onSetAlert(selectedAssetSymbol, priceInUsd);
    setTargetPrice('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('price_alert')}>
      <div className="space-y-6">
        {/* Form to add a new alert */}
        <div className="bg-background-tertiary p-4 rounded-lg space-y-4">
          <h3 className="font-bold text-text-primary">{t('set_alert')}</h3>
          <div>
            <label className="text-sm font-medium text-text-secondary">{t('asset')}</label>
            <div className="mt-1">
              <SelectField
                valueLabel={`${selectedAsset?.name || selectedAssetSymbol} (${selectedAssetSymbol})`}
                onClick={() => setIsAssetPickerOpen(true)}
                className="w-full bg-background-primary border border-border-divider rounded-lg p-3 ltr:pl-4 ltr:pr-10 rtl:pr-4 rtl:pl-10 focus:ring-2 focus:outline-none font-bold text-text-primary"
                style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
              />
            </div>
          </div>
          <div>
            <label htmlFor="target-price" className="text-sm font-medium text-text-secondary">{t('target_price')}</label>
            <div className="relative mt-1">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary">{symbol}</span>
              <input
                id="target-price"
                type="number"
                step="0.001"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="1.05"
                className="w-full bg-background-primary border border-border-divider rounded-lg p-3 ps-7 focus:ring-2 focus:outline-none text-left"
                dir="ltr"
                style={{ '--tw-ring-color': `var(--tw-color-${primaryColor})` } as React.CSSProperties}
              />
            </div>
             <p className="text-xs text-text-secondary mt-1">{t('current_price')}: {formatCurrency(selectedAsset?.usdValue || 0)}</p>
          </div>
          <button onClick={handleSetAlert} className={`w-full p-3 rounded-lg font-bold text-background-primary bg-${primaryColor}`} disabled={!targetPrice}>
            {t('set_alert')}
          </button>
        </div>

        {/* List of active alerts */}
        <div>
          <h3 className="font-bold text-text-primary mb-3">{t('active_alerts')}</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map(alert => (
                <div key={alert.id} className="bg-background-tertiary p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {t('when')} {alert.assetSymbol} {t('reaches')} {formatCurrency(alert.targetPrice)}
                    </p>
                     <p className="text-xs text-text-secondary">
                      {t('set_when_price_was')} {formatCurrency(alert.priceAtCreation)}
                    </p>
                  </div>
                  <button onClick={() => onDeleteAlert(alert.id)} className="text-error hover:opacity-80 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-secondary text-center py-4">{t('no_active_alerts')}</p>
            )}
          </div>
        </div>
      </div>

      <SelectModal
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        title={t('asset')}
        value={selectedAssetSymbol}
        searchable
        searchPlaceholder={t('search_asset')}
        accentColorClassName={primaryColor === 'brand-yellow' ? 'text-brand-yellow' : 'text-brand-green'}
        options={WALLETS.map((wallet) => ({
          value: wallet.symbol,
          label: `${wallet.name} (${wallet.symbol})`,
          description: wallet.network,
        }))}
        onChange={(sym) => setSelectedAssetSymbol(sym as PriceAlert['assetSymbol'])}
      />
    </Modal>
  );
};