import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchProducts } from '../lib/queries';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { Badge, Button, Card, EmptyState, Input, Select, Spinner } from '../components/ui';
import type { Product } from '../lib/types';

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const add = () => {
    addItem({
      productId: product.id,
      label: product.name,
      quantity: 1,
      unitPrice: Number(product.price),
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl">🛒</span>
        )}
      </div>
      <div className="flex-1">
        {product.category && <Badge className="bg-brand-100 text-brand-600">{product.category.name}</Badge>}
        <h3 className="mt-2 font-semibold text-brand-800">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-brand-500">{product.description}</p>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold text-brand-700">{formatMAD(product.price)}</span>
        <Button variant={added ? 'outline' : 'accent'} onClick={add}>
          {added ? 'Ajouté ✓' : 'Ajouter'}
        </Button>
      </div>
    </Card>
  );
}

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const products = useQuery({
    queryKey: ['products', search, categoryId],
    queryFn: () => fetchProducts({ search: search || undefined, categoryId: categoryId || undefined }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Catalogue</h1>
        <p className="text-brand-600">Fournitures, manuels et accessoires scolaires.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Rechercher un article…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="sm:w-56">
          <option value="">Toutes les catégories</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {products.isLoading ? (
        <Spinner label="Chargement du catalogue…" />
      ) : products.isError ? (
        <EmptyState title="Impossible de charger le catalogue" description="Vérifiez que l'API est démarrée." />
      ) : products.data && products.data.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun article trouvé" description="Essayez une autre recherche ou catégorie." />
      )}
    </div>
  );
}
