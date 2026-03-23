import { PriceInfo, PriceEntry } from '@/lib/types';
import { ExternalLink, Tag } from 'lucide-react';

interface PriceComparisonTableProps {
  prices: PriceInfo;
}

const storeNames: Record<string, string> = {
  steam: 'Steam',
  epic: 'Epic Games',
  playstation: 'PlayStation Store',
  xbox: 'Xbox Store',
  nintendo: 'Nintendo eShop',
};

export default function PriceComparisonTable({ prices }: PriceComparisonTableProps) {
  const entries = Object.entries(prices).filter(
    (entry): entry is [string, PriceEntry] => entry[1] !== undefined
  );

  if (entries.length === 0) return null;

  // Find lowest effective price
  const effectivePrices = entries.map(([store, entry]) => ({
    store,
    effective: entry.onSale && entry.salePrice ? entry.salePrice : entry.price,
    ...entry,
  }));
  const lowestPrice = Math.min(...effectivePrices.map(p => p.effective));

  return (
    <div className="bg-bg-card rounded-sm border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Where to Buy</h3>
      </div>
      <div className="divide-y divide-border">
        {effectivePrices.map(({ store, price, onSale, salePrice, effective }) => {
          const isBestDeal = effective === lowestPrice && entries.length > 1;
          return (
            <div key={store} className="flex items-center justify-between px-4 py-3 hover:bg-bg-elevated transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-primary">{storeNames[store] || store}</span>
                {onSale && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">
                    Sale
                  </span>
                )}
                {isBestDeal && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                    Best Deal
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {onSale && salePrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted line-through">${price.toFixed(2)}</span>
                      <span className="text-sm font-bold text-green-400">${salePrice.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-text-primary">${price.toFixed(2)}</span>
                  )}
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent-orange text-black hover:bg-accent-orange-hover transition-colors">
                  Buy <ExternalLink size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 bg-bg-elevated/50">
        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <Tag size={10} />
          Prices updated Mar 7, 2026
        </p>
      </div>
    </div>
  );
}
