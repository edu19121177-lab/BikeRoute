import { useMemo, useState } from 'react';
import { Clock, MapPin, Search, Wrench } from 'lucide-react';
import type { LocationRecord, RepairRecord } from '../types/cycling.ts';

interface RepairsDirectoryViewProps {
  repairs: RepairRecord[];
  locations: LocationRecord[];
  onViewLocationOnMap: (locationId: string) => void;
}

export function RepairsDirectoryView({
  repairs,
  locations,
  onViewLocationOnMap,
}: RepairsDirectoryViewProps) {
  const [serviceCategory, setServiceCategory] = useState<string>('Todas');
  const [bikeType, setBikeType] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const locationById = useMemo(() => {
    const map: Record<string, LocationRecord> = {};
    for (const loc of locations) {
      map[loc.id] = loc;
    }
    return map;
  }, [locations]);

  const serviceCategories = useMemo(() => {
    const set = new Set<string>();
    for (const r of repairs) {
      if (r.service_category) set.add(r.service_category);
    }
    return Array.from(set).sort();
  }, [repairs]);

  const filteredRepairs = useMemo(() => {
    return repairs.filter((r) => {
      if (
        serviceCategory !== 'Todas' &&
        r.service_category.toLowerCase() !== serviceCategory.toLowerCase()
      ) {
        return false;
      }
      if (
        bikeType !== 'Todas' &&
        r.bike_type.toLowerCase() !== 'todas' &&
        r.bike_type.toLowerCase() !== bikeType.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const loc = locationById[r.location_id];
        const hay = `${r.service_name} ${r.service_category} ${r.bike_type} ${r.description} ${loc?.name ?? ''} ${loc?.address ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [repairs, serviceCategory, bikeType, searchQuery, locationById]);

  return (
    <section aria-label="Talleres y tarifas de reparación" className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Talleres, estaciones y tarifas de reparación
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Compara servicios mecánicos, tiempos estimados y tarifas por tipo de
            bicicleta o especialidad.
          </p>
        </div>
        <p className="text-xs font-mono tabular-nums text-slate-500">
          {filteredRepairs.length} servicios registrados
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {['Todas', ...serviceCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setServiceCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                serviceCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:max-w-lg lg:justify-end">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicio (ej. neumáticos, frenos)..."
              aria-label="Buscar servicio de reparación"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <select
            value={bikeType}
            onChange={(e) => setBikeType(e.target.value)}
            aria-label="Filtrar reparaciones por tipo de bicicleta"
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          >
            <option value="Todas">Cualquier bicicleta</option>
            <option value="Urbana">Urbana</option>
            <option value="Montaña">Montaña</option>
            <option value="Gravel">Gravel</option>
            <option value="Ruta">Ruta</option>
            <option value="Eléctrica">Eléctrica</option>
          </select>
        </div>
      </div>

      {/* Desktop Table & Mobile Cards */}
      {filteredRepairs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <Wrench className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-900">
            Sin servicios coincidentes
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Ajusta los filtros de especialidad o tipo de bicicleta.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Servicio y descripción</th>
                  <th className="py-3 px-4">Especialidad</th>
                  <th className="py-3 px-4">Bicicleta</th>
                  <th className="py-3 px-4">Local / Taller</th>
                  <th className="py-3 px-4 text-right">Tiempo</th>
                  <th className="py-3 px-4 text-right">Tarifa</th>
                  <th className="py-3 px-4 text-right">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRepairs.map((repair) => {
                  const loc = locationById[repair.location_id];
                  return (
                    <tr
                      key={repair.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-slate-900">
                          {repair.service_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {repair.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {repair.service_category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {repair.bike_type}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-xs font-medium text-slate-900">
                          {loc ? loc.name : 'Taller registrado'}
                        </p>
                        {loc && (
                          <p className="text-xs text-slate-500">
                            {loc.address}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {repair.estimated_minutes} min
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        ${repair.price.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {loc && (
                          <button
                            type="button"
                            onClick={() => onViewLocationOnMap(loc.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Mapa</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
            {filteredRepairs.map((repair) => {
              const loc = locationById[repair.location_id];
              return (
                <div key={repair.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {repair.service_category} · {repair.bike_type}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                        {repair.service_name}
                      </h3>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 whitespace-nowrap shrink-0">
                      ${repair.price.toFixed(2)} USD
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{repair.description}</p>
                  <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono tabular-nums">
                        {repair.estimated_minutes} min
                      </span>
                    </span>
                    {loc && (
                      <button
                        type="button"
                        onClick={() => onViewLocationOnMap(loc.id)}
                        className="inline-flex items-center gap-1 font-medium text-emerald-700"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{loc.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
