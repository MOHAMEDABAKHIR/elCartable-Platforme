import { Card } from '../ui';

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  price: number;
}

interface LowStockCardProps {
  products: LowStockProduct[];
}

export function LowStockCard({
  products,
}: LowStockCardProps) {

  return (
    <Card>

      <div className="mb-5 flex items-center justify-between">

        <h2 className="text-lg font-bold text-brand-900">
          Stock faible
        </h2>

        <span className="text-sm text-brand-500">
          {products.length} produit(s)
        </span>

      </div>


      {products.length === 0 ? (

        <p className="text-sm text-brand-500">
          Aucun produit en rupture imminente.
        </p>

      ) : (

        <div className="space-y-4">

          {products.map((product) => (

            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg bg-brand-50 p-3"
            >

              <div>

                <p className="font-medium text-brand-900">
                  {product.name}
                </p>


                <p className="text-xs text-brand-500">
                  Prix : {product.price} MAD
                </p>

              </div>


              <div
                className={
                  product.stock === 0
                    ? "font-bold text-red-600"
                    : "font-bold text-orange-600"
                }
              >

                {product.stock === 0
                  ? "Rupture"
                  : `${product.stock} restant(s)`}

              </div>


            </div>

          ))}

        </div>

      )}

    </Card>
  );
}