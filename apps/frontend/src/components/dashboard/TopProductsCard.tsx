import { Card } from '../ui';
import { formatMAD } from '../../lib/format';

interface ProductItem {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface TopProductsCardProps {
  products: ProductItem[];
}

export function TopProductsCard({
  products,
}: TopProductsCardProps) {
  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-900">
          Produits les plus vendus
        </h2>

        <span className="text-sm text-brand-500">
          Top {products.length}
        </span>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-brand-500">
          Aucun produit vendu.
        </p>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.productId || product.name}
              className="flex items-center justify-between border-b border-brand-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {index + 1}
                </div>

                <div>
                  <p className="font-medium text-brand-900">
                    {product.name}
                  </p>

                  <p className="text-xs text-brand-500">
                    {product.quantity} vendu{product.quantity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-brand-900">
                  {formatMAD(product.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}