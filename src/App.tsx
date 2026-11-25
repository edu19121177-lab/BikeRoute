import { useCallback, useEffect, useState } from 'react';
import { Menu, MessageSquare, X } from 'lucide-react';
import {
  fetchLocations,
  fetchProducts,
  fetchPublicConfig,
  fetchRepairs,
} from './lib/api.ts';
import type {
  LocationRecord,
  ProductRecord,
  RepairRecord,
} from './types/cycling.ts';
import { BikeMapView } from './components/BikeMapView.tsx';
import { CatalogView } from './components/CatalogView.tsx';
import { RepairsDirectoryView } from './components/RepairsDirectoryView.tsx';
import { CrudManagerView } from './components/CrudManagerView.tsx';
import { GeminiAssistantPanel } from './components/GeminiAssistantPanel.tsx';

type NavSection = 'mapa' | 'catalogo' | 'talleres' | 'crud';

const QUICK_ASSISTANT_QUESTIONS = [
  '¿Qué talleres registrados reparan neumáticos de bicicleta?',
  '¿Qué accesorios necesito para circular de forma segura?',
  '¿Qué bicicletas del catálogo se ajustan a mi presupuesto?',
];

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('mapa');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [storageMode, setStorageMode] = useState<'supabase' | 'local'>('local');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoadError(null);
      const [cfg, locs, prods, reps] = await Promise.all([
        fetchPublicConfig(),
        fetchLocations(),
        fetchProducts(),
        fetchRepairs(),
      ]);
      if (cfg.googleMapsApiKey) {
        setMapsApiKey(cfg.googleMapsApiKey);
      }
      setStorageMode(cfg.storageMode);
      setLocations(locs);
      setProducts(prods);
      setRepairs(reps);
      if (locs.length > 0) {
        setSelectedLocationId((prev) =>
          prev && locs.some((l) => l.id === prev) ? prev : locs[0].id
        );
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Error al cargar los registros del sistema.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const handleViewLocationOnMap = (locationId: string) => {
    setSelectedLocationId(locationId);
    setActiveSection('mapa');
    const mapEl = document.getElementById('workspace-section');
    mapEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const launchAssistantWithPrompt = (prompt: string) => {
    setAssistantPrompt(prompt);
    setAssistantOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (4 Nav Links) - Zone 3 (1 Primary CTA) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('mapa');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            RuedaLibre
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            {[
              { id: 'mapa' as const, label: 'Mapa' },
              { id: 'catalogo' as const, label: 'Catálogo' },
              { id: 'talleres' as const, label: 'Talleres y Tarifas' },
              { id: 'crud' as const, label: 'Gestión CRUD' },
            ].map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-emerald-600 text-slate-900'
                      : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Asistente IA</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Abrir menú de navegación"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1">
            {[
              { id: 'mapa' as const, label: 'Mapa' },
              { id: 'catalogo' as const, label: 'Catálogo' },
              { id: 'talleres' as const, label: 'Talleres y Tarifas' },
              { id: 'crud' as const, label: 'Gestión CRUD' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activeSection === item.id
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Split Section */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <p className="text-xs font-medium text-emerald-700 tracking-wide">
                  Red ciclista urbana · Tiendas, talleres y estaciones
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                  Encuentra talleres, bicicletas y servicio técnico en un solo lugar
                </h1>
                <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                  Consulta ubicaciones reales en Google Maps, filtra bicicletas y
                  accesorios de seguridad por disponibilidad o presupuesto, y
                  pregunta a nuestro asistente inteligente conectado al catálogo.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection('mapa')}
                    className="px-5 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    Explorar mapa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('catalogo')}
                    className="px-5 py-2.5 text-sm font-medium bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    Ver catálogo
                  </button>
                </div>
              </div>

              {/* Direct test queries for Gemini assistant */}
              <div className="pt-5 border-t border-slate-100 space-y-2.5">
                <p className="text-xs font-medium text-slate-500">
                  Consultas de prueba para el asistente Gemini
                </p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  {QUICK_ASSISTANT_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => launchAssistantWithPrompt(q)}
                      className="text-left text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:border-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[260px] bg-slate-100">
              <img
                src="/src/assets/images/hero_urban_workshop_1795624886297.jpg"
                alt="Taller mecánico de bicicletas urbanas y exhibición de cuadros"
                referrerPolicy="no-referrer"
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
          </div>

          {/* Full-width 3-column live inventory strip below hero */}
          <div className="border-t border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="px-6 py-4 flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-600">
                Locales y estaciones registradas
              </span>
              <span className="text-xl font-mono font-semibold tabular-nums text-slate-900">
                {locations.length}
              </span>
            </div>
            <div className="px-6 py-4 flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-600">
                Bicicletas y accesorios en catálogo
              </span>
              <span className="text-xl font-mono font-semibold tabular-nums text-slate-900">
                {products.length}
              </span>
            </div>
            <div className="px-6 py-4 flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-600">
                Servicios de reparación y tarifas
              </span>
              <span className="text-xl font-mono font-semibold tabular-nums text-slate-900">
                {repairs.length}
              </span>
            </div>
          </div>
        </section>

        {/* Active Workspace Section */}
        <div id="workspace-section">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-600">
              Cargando catálogo, mapa y tarifas desde la base de datos...
            </div>
          ) : loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3">
              <p className="text-sm font-semibold text-red-900">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadAllData()}
                className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {activeSection === 'mapa' && (
                <BikeMapView
                  apiKey={mapsApiKey}
                  locations={locations}
                  products={products}
                  repairs={repairs}
                  selectedLocationId={selectedLocationId}
                  onSelectLocation={setSelectedLocationId}
                />
              )}

              {activeSection === 'catalogo' && (
                <CatalogView
                  products={products}
                  locations={locations}
                  onViewLocationOnMap={handleViewLocationOnMap}
                />
              )}

              {activeSection === 'talleres' && (
                <RepairsDirectoryView
                  repairs={repairs}
                  locations={locations}
                  onViewLocationOnMap={handleViewLocationOnMap}
                />
              )}

              {activeSection === 'crud' && (
                <CrudManagerView
                  locations={locations}
                  products={products}
                  repairs={repairs}
                  storageMode={storageMode}
                  onDataChanged={loadAllData}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            RuedaLibre · Tiendas de bicicletas, talleres mecánicos y estaciones
            de servicio ciclista
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection('crud')}
              className="hover:text-slate-900 underline"
            >
              Administrar registros
            </button>
            <button
              type="button"
              onClick={() => setAssistantOpen(true)}
              className="hover:text-slate-900 underline"
            >
              Consultar asistente Gemini
            </button>
          </div>
        </div>
      </footer>

      <GeminiAssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        initialPrompt={assistantPrompt}
        onClearInitialPrompt={() => setAssistantPrompt(null)}
      />
    </div>
  );
}
