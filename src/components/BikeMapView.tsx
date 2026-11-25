import { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Clock,
  Mail,
  MapPin,
  Phone,
  Search,
  Wrench,
  ShoppingBag,
  Navigation,
} from 'lucide-react';
import type {
  LocationCategory,
  LocationRecord,
  ProductRecord,
  RepairRecord,
} from '../types/cycling.ts';

interface BikeMapViewProps {
  apiKey: string;
  locations: LocationRecord[];
  products: ProductRecord[];
  repairs: RepairRecord[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string | null) => void;
}

const CATEGORY_LABELS: Record<LocationCategory, string> = {
  tienda: 'Tienda',
  taller: 'Taller de reparación',
  estacion: 'Estación de servicio',
};

const PIN_STYLES: Record<
  LocationCategory,
  { background: string; borderColor: string; glyphColor: string; glyph: string }
> = {
  tienda: {
    background: '#2563EB',
    borderColor: '#1E40AF',
    glyphColor: '#FFFFFF',
    glyph: 'T',
  },
  taller: {
    background: '#059669',
    borderColor: '#065F46',
    glyphColor: '#FFFFFF',
    glyph: 'R',
  },
  estacion: {
    background: '#D97706',
    borderColor: '#92400E',
    glyphColor: '#FFFFFF',
    glyph: 'E',
  },
};

function MapCameraSync({
  selectedLocation,
}: {
  selectedLocation: LocationRecord | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      });
      const currentZoom = map.getZoom();
      if (!currentZoom || currentZoom < 13) {
        map.setZoom(14);
      }
    }
  }, [map, selectedLocation]);

  return null;
}

function LocationMarkerWithInfo({
  location,
  isSelected,
  onSelect,
  productsCount,
  repairsCount,
}: {
  location: LocationRecord;
  isSelected: boolean;
  onSelect: () => void;
  productsCount: number;
  repairsCount: number;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const style = PIN_STYLES[location.category];

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: location.latitude, lng: location.longitude }}
        title={location.name}
        onClick={onSelect}
        zIndex={isSelected ? 50 : 10}
      >
        <Pin
          background={style.background}
          borderColor={style.borderColor}
          glyphColor={style.glyphColor}
          scale={isSelected ? 1.25 : 1}
          glyph={style.glyph}
        />
      </AdvancedMarker>
      {isSelected && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={300}
          onCloseClick={() => {
            /* handled cleanly in parent if needed */
          }}
        >
          <div className="p-1 text-slate-900 font-sans">
            <p className="text-xs font-medium text-slate-500">
              {CATEGORY_LABELS[location.category]} ·{' '}
              {location.available ? 'Disponible' : 'Cerrado temporalmente'}
            </p>
            <h4 className="mt-0.5 text-sm font-semibold text-slate-900">
              {location.name}
            </h4>
            <p className="mt-1 text-xs text-slate-600">{location.address}</p>
            <p className="mt-1 text-xs text-slate-600">
              Tel: {location.phone}
            </p>
            <p className="mt-1 text-xs text-slate-600">{location.hours}</p>
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-3 text-xs text-slate-700 tabular-nums">
              <span>{productsCount} productos</span>
              <span aria-hidden="true">·</span>
              <span>{repairsCount} reparaciones</span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapStatusObserver() {
  const status = useApiLoadingStatus();
  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-100/95 p-6 text-center z-10">
        <div className="max-w-md space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            No se pudo cargar el mapa de Google Maps
          </p>
          <p className="text-xs text-slate-600">
            Verifica la clave de API configurada o la cuota disponible para tu
            proyecto. Puedes seguir consultando todos los locales en el panel
            lateral.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function BikeMapView({
  apiKey,
  locations,
  products,
  repairs,
  selectedLocationId,
  onSelectLocation,
}: BikeMapViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [bikeTypeFilter, setBikeTypeFilter] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (categoryFilter !== 'todos' && loc.category !== categoryFilter) {
        return false;
      }
      if (
        bikeTypeFilter !== 'Todas' &&
        !loc.bike_types_supported.some(
          (b) => b.toLowerCase() === bikeTypeFilter.toLowerCase()
        )
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          loc.name,
          loc.address,
          loc.description,
          ...loc.services_summary,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [locations, categoryFilter, bikeTypeFilter, searchQuery]);

  const selectedLocation = useMemo(() => {
    if (!filteredLocations.length) return null;
    return (
      filteredLocations.find((l) => l.id === selectedLocationId) ||
      filteredLocations[0]
    );
  }, [filteredLocations, selectedLocationId]);

  const selectedProducts = useMemo(() => {
    if (!selectedLocation) return [];
    return products.filter((p) => p.location_id === selectedLocation.id);
  }, [products, selectedLocation]);

  const selectedRepairs = useMemo(() => {
    if (!selectedLocation) return [];
    return repairs.filter((r) => r.location_id === selectedLocation.id);
  }, [repairs, selectedLocation]);

  const defaultCenter = useMemo(() => {
    if (filteredLocations.length > 0) {
      return {
        lat: filteredLocations[0].latitude,
        lng: filteredLocations[0].longitude,
      };
    }
    return { lat: -34.5997, lng: -58.4071 };
  }, [filteredLocations]);

  return (
    <section aria-label="Mapa interactivo de locales" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Mapa interactivo de locales y talleres
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Selecciona cualquier marcador para consultar dirección, contacto,
            bicicletas en stock y tarifas de reparación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"
              aria-hidden="true"
            />
            Tienda (T)
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"
              aria-hidden="true"
            />
            Taller (R)
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"
              aria-hidden="true"
            />
            Estación (E)
          </span>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'tienda', label: 'Tiendas' },
            { id: 'taller', label: 'Talleres' },
            { id: 'estacion', label: 'Estaciones' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                categoryFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-xl lg:justify-end">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por barrio, nombre o servicio (ej. neumáticos)..."
              aria-label="Buscar locales en el mapa"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <select
            value={bikeTypeFilter}
            onChange={(e) => setBikeTypeFilter(e.target.value)}
            aria-label="Filtrar por tipo de bicicleta"
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          >
            <option value="Todas">Todos los tipos</option>
            <option value="Urbana">Urbana</option>
            <option value="Montaña">Montaña</option>
            <option value="Gravel">Gravel</option>
            <option value="Ruta">Ruta</option>
            <option value="Eléctrica">Eléctrica</option>
            <option value="Plegable">Plegable</option>
          </select>
        </div>
      </div>

      {/* Main Map + Details split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden relative min-h-[420px] h-[460px] lg:h-[580px]">
          {apiKey ? (
            <APIProvider
              apiKey={apiKey}
              libraries={['marker']}
              language="es"
              region="AR"
            >
              <MapStatusObserver />
              <GoogleMap
                mapId="DEMO_MAP_ID"
                defaultCenter={defaultCenter}
                defaultZoom={12}
                gestureHandling="greedy"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
              >
                <MapCameraSync selectedLocation={selectedLocation} />
                {filteredLocations.map((loc) => (
                  <LocationMarkerWithInfo
                    key={loc.id}
                    location={loc}
                    isSelected={selectedLocation?.id === loc.id}
                    onSelect={() => onSelectLocation(loc.id)}
                    productsCount={
                      products.filter((p) => p.location_id === loc.id).length
                    }
                    repairsCount={
                      repairs.filter((r) => r.location_id === loc.id).length
                    }
                  />
                ))}
              </GoogleMap>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-100">
              <MapPin className="w-8 h-8 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-900">
                Clave de Google Maps pendiente
              </p>
              <p className="mt-1 text-xs text-slate-600 max-w-sm">
                Configura <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
                en tus variables de entorno para activar el mapa interactivo.
              </p>
            </div>
          )}
        </div>

        {/* Right panel: Locations selector + selected local detail */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Quick location list */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Ubicaciones registradas ({filteredLocations.length})
              </h3>
            </div>
            {filteredLocations.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No hay locales que coincidan con el filtro aplicado.
              </p>
            ) : (
              <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                {filteredLocations.map((loc) => {
                  const active = selectedLocation?.id === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => onSelectLocation(loc.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        active
                          ? 'bg-emerald-50/70 border-emerald-600 text-slate-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {loc.name}
                        </span>
                        <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                          {CATEGORY_LABELS[loc.category]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600 truncate">
                        {loc.address}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected local details */}
          {selectedLocation && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{CATEGORY_LABELS[selectedLocation.category]}</span>
                    <span
                      className={
                        selectedLocation.available
                          ? 'text-emerald-700 font-medium'
                          : 'text-amber-700 font-medium'
                      }
                    >
                      {selectedLocation.available
                        ? 'Abierto / Operativo'
                        : 'No disponible'}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {selectedLocation.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedLocation.description}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-slate-700 border-t border-slate-100 pt-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{selectedLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono tabular-nums text-xs">
                      {selectedLocation.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs">{selectedLocation.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs">{selectedLocation.hours}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Navigation className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono tabular-nums text-xs text-slate-500">
                      {selectedLocation.latitude.toFixed(4)},{' '}
                      {selectedLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">
                    Tipos de bicicleta atendidos
                  </p>
                  <p className="text-sm text-slate-800">
                    {selectedLocation.bike_types_supported.join(' · ')}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Catálogo en sede</span>
                    </div>
                    <p className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900">
                      {selectedProducts.length}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Tarifas registradas</span>
                    </div>
                    <p className="mt-1 text-lg font-mono font-semibold tabular-nums text-slate-900">
                      {selectedRepairs.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
