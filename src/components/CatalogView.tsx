import { useMemo, useState } from 'react';
import { Bike, MapPin, Search, ShieldCheck } from 'lucide-react';
import type { LocationRecord, ProductRecord } from '../types/cycling.ts';

interface CatalogViewProps {
  products: ProductRecord[];
  locations: LocationRecord[];
  onViewLocationOnMap: (locationId: string) => void;
}

export function CatalogView({
  products,
  locations,
  onViewLocationOnMap,
}: CatalogViewProps) {
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('todos');
  const [bikeTypeFilter, setBikeTypeFilter] = useState<string>('Todas');
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const locationById = useMemo(() => {
    const map: Record<string, LocationRecord> = {};
    for (const loc of locations) {
      map[loc.id] = loc;
    }
    return map;
  }, [locations]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.bike_type) set.add(p.bike_type);
    }
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const budgetNum = maxBudget ? Number(maxBudget) : undefined;
    return products.filter((p) => {
      if (itemTypeFilter !== 'todos' && p.item_type !== itemTypeFilter) {
        return false;
      }
      if (
        bikeTypeFilter !== 'Todas' &&
        p.bike_type.toLowerCase() !== bikeTypeFilter.toLowerCase()
      ) {
        return false;
      }
      if (
        budgetNum !== undefined &&
        !Number.isNaN(budgetNum) &&
        budgetNum > 0 &&
        p.price > budgetNum
      ) {
        return false;
      }
      if (onlyAvailable && (!p.available || p.stock <= 0)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const locName = locationById[p.location_id]?.name ?? '';
        const hay =
          `${p.name} ${p.brand} ${p.bike_type} ${p.specs} ${locName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    products,
    itemTypeFilter,
    bikeTypeFilter,
    maxBudget,
    onlyAvailable,
    searchQuery,
    locationById,
  ]);

  return (
    <section aria-label="Catálogo de bicicletas y accesorios" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Catálogo de bicicletas y accesorios
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Explora bicicletas urbanas, gravel, montaña y equipamiento de
            seguridad con stock por tienda.
          </p>
        </div>
        <p className="text-xs font-mono tabular-nums text-slate-500">
          {filteredProducts.length} resultados disponibles
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'todos', label: 'Todo el catálogo' },
            { id: 'bicicleta', label: 'Bicicletas' },
            { id: 'accesorio', label: 'Accesorios' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setItemTypeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                itemTypeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 flex-1 lg:justify-end">
          <div className="relative flex-1 lg:max-w-xs">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar modelo, marca o casco..."
              aria-label="Buscar en el catálogo"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <select
            value={bikeTypeFilter}
            onChange={(e) => setBikeTypeFilter(e.target.value)}
            aria-label="Filtrar por tipo o categoría"
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          >
            <option value="Todas">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            placeholder="Presupuesto máx. USD"
            aria-label="Presupuesto máximo en USD"
            className="w-full lg:w-44 px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />

          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer whitespace-nowrap shrink-0 px-2 py-2">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            <span>Solo con stock</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-base font-semibold text-slate-900">
            No encontramos productos con esos criterios
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Prueba ampliando el presupuesto máximo o seleccionando otra
            categoría.
          </p>
          <button
            type="button"
            onClick={() => {
              setItemTypeFilter('todos');
              setBikeTypeFilter('Todas');
              setMaxBudget('');
              setOnlyAvailable(false);
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const loc = locationById[product.location_id];
            const imageFailed = failedImages[product.id];
            const isAvailable = product.available && product.stock > 0;

            return (
              <article
                key={product.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                    {!imageFailed && product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [product.id]: true,
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-6 text-center">
                        {product.item_type === 'bicicleta' ? (
                          <Bike className="w-10 h-10 mb-2" />
                        ) : (
                          <ShieldCheck className="w-10 h-10 mb-2" />
                        )}
                        <span className="text-xs font-medium text-slate-500">
                          {product.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        {product.brand} · {product.bike_type}
                      </span>
                      <span
                        className={
                          isAvailable
                            ? 'text-emerald-700 font-medium'
                            : 'text-amber-700 font-medium'
                        }
                      >
                        {isAvailable
                          ? `Stock: ${product.stock}`
                          : 'Sin stock'}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <span className="text-base font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap shrink-0">
                        ${product.price.toFixed(0)} USD
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {product.specs}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {loc ? loc.name : 'Sede registrada'}
                    </p>
                    {loc && (
                      <p className="text-xs text-slate-500 truncate">
                        {loc.address}
                      </p>
                    )}
                  </div>
                  {loc && (
                    <button
                      type="button"
                      onClick={() => onViewLocationOnMap(loc.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Ver mapa</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
