import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type {
  LocationCategory,
  LocationRecord,
  ProductItemType,
  ProductRecord,
  RepairRecord,
} from '../types/cycling.ts';
import {
  createLocationApi,
  createProductApi,
  createRepairApi,
  deleteLocationApi,
  deleteProductApi,
  deleteRepairApi,
  updateLocationApi,
  updateProductApi,
  updateRepairApi,
} from '../lib/api.ts';

interface CrudManagerViewProps {
  locations: LocationRecord[];
  products: ProductRecord[];
  repairs: RepairRecord[];
  storageMode: 'supabase' | 'local';
  onDataChanged: () => Promise<void>;
}

type EntityTab = 'locations' | 'products' | 'repairs';

export function CrudManagerView({
  locations,
  products,
  repairs,
  storageMode,
  onDataChanged,
}: CrudManagerViewProps) {
  const [activeTab, setActiveTab] = useState<EntityTab>('locations');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    tab: EntityTab;
    id: string;
    label: string;
  } | null>(null);

  // Form modal states
  const [locationModal, setLocationModal] = useState<{
    open: boolean;
    editingId: string | null;
    name: string;
    category: LocationCategory;
    address: string;
    phone: string;
    email: string;
    hours: string;
    latitude: string;
    longitude: string;
    description: string;
    bikeTypes: string;
    servicesSummary: string;
    available: boolean;
  }>({
    open: false,
    editingId: null,
    name: '',
    category: 'taller',
    address: '',
    phone: '',
    email: '',
    hours: 'Lun a Sáb 09:00 - 19:00',
    latitude: '-34.5950',
    longitude: '-58.4100',
    description: '',
    bikeTypes: 'Urbana, Gravel, Montaña',
    servicesSummary: 'Reparación de neumáticos, Ajuste de frenos',
    available: true,
  });

  const [productModal, setProductModal] = useState<{
    open: boolean;
    editingId: string | null;
    location_id: string;
    item_type: ProductItemType;
    name: string;
    brand: string;
    bike_type: string;
    price: string;
    stock: string;
    specs: string;
    available: boolean;
  }>({
    open: false,
    editingId: null,
    location_id: '',
    item_type: 'bicicleta',
    name: '',
    brand: '',
    bike_type: 'Urbana',
    price: '450',
    stock: '5',
    specs: '',
    available: true,
  });

  const [repairModal, setRepairModal] = useState<{
    open: boolean;
    editingId: string | null;
    location_id: string;
    service_name: string;
    service_category: string;
    bike_type: string;
    price: string;
    estimated_minutes: string;
    description: string;
    available: boolean;
  }>({
    open: false,
    editingId: null,
    location_id: '',
    service_name: '',
    service_category: 'Neumáticos',
    bike_type: 'Todas',
    price: '15',
    estimated_minutes: '20',
    description: '',
    available: true,
  });

  const openNewModal = () => {
    setFeedback(null);
    if (activeTab === 'locations') {
      setLocationModal({
        open: true,
        editingId: null,
        name: '',
        category: 'taller',
        address: '',
        phone: '',
        email: '',
        hours: 'Lun a Sáb 09:00 - 19:00',
        latitude: '-34.5950',
        longitude: '-58.4100',
        description: '',
        bikeTypes: 'Urbana, Gravel, Montaña',
        servicesSummary: 'Reparación de neumáticos, Ajuste de frenos',
        available: true,
      });
    } else if (activeTab === 'products') {
      setProductModal({
        open: true,
        editingId: null,
        location_id: locations[0]?.id ?? '',
        item_type: 'bicicleta',
        name: '',
        brand: '',
        bike_type: 'Urbana',
        price: '450',
        stock: '5',
        specs: '',
        available: true,
      });
    } else {
      setRepairModal({
        open: true,
        editingId: null,
        location_id: locations[0]?.id ?? '',
        service_name: '',
        service_category: 'Neumáticos',
        bike_type: 'Todas',
        price: '15',
        estimated_minutes: '20',
        description: '',
        available: true,
      });
    }
  };

  const handleSaveLocation = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const payload = {
        name: locationModal.name.trim(),
        category: locationModal.category,
        address: locationModal.address.trim(),
        phone: locationModal.phone.trim(),
        email: locationModal.email.trim() || 'contacto@ruedalibre.com',
        hours: locationModal.hours.trim(),
        latitude: Number(locationModal.latitude),
        longitude: Number(locationModal.longitude),
        description: locationModal.description.trim(),
        available: locationModal.available,
        bike_types_supported: locationModal.bikeTypes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        services_summary: locationModal.servicesSummary
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (locationModal.editingId) {
        await updateLocationApi(locationModal.editingId, payload);
        setFeedback({ type: 'success', text: 'Local actualizado correctamente.' });
      } else {
        await createLocationApi(payload);
        setFeedback({ type: 'success', text: 'Nuevo local registrado.' });
      }
      setLocationModal((prev) => ({ ...prev, open: false }));
      await onDataChanged();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar el local.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const payload = {
        location_id: productModal.location_id,
        item_type: productModal.item_type,
        name: productModal.name.trim(),
        brand: productModal.brand.trim(),
        bike_type: productModal.bike_type.trim(),
        price: Number(productModal.price),
        stock: Number(productModal.stock),
        available: productModal.available,
        specs: productModal.specs.trim(),
        image_url:
          productModal.item_type === 'accesorio'
            ? '/src/assets/images/cycling_gear_safety_1795624886403.jpg'
            : productModal.bike_type === 'Montaña' ||
                productModal.bike_type === 'Gravel'
              ? '/src/assets/images/bike_mtb_gravel_1795624886633.jpg'
              : '/src/assets/images/bike_urban_commuter_1795624885348.jpg',
      };

      if (productModal.editingId) {
        await updateProductApi(productModal.editingId, payload);
        setFeedback({ type: 'success', text: 'Producto actualizado.' });
      } else {
        await createProductApi(payload);
        setFeedback({ type: 'success', text: 'Producto agregado al catálogo.' });
      }
      setProductModal((prev) => ({ ...prev, open: false }));
      await onDataChanged();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar producto.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveRepair = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const payload = {
        location_id: repairModal.location_id,
        service_name: repairModal.service_name.trim(),
        service_category: repairModal.service_category.trim(),
        bike_type: repairModal.bike_type.trim(),
        price: Number(repairModal.price),
        estimated_minutes: Number(repairModal.estimated_minutes),
        available: repairModal.available,
        description: repairModal.description.trim(),
      };

      if (repairModal.editingId) {
        await updateRepairApi(repairModal.editingId, payload);
        setFeedback({ type: 'success', text: 'Tarifa de reparación actualizada.' });
      } else {
        await createRepairApi(payload);
        setFeedback({ type: 'success', text: 'Servicio registrado.' });
      }
      setRepairModal((prev) => ({ ...prev, open: false }));
      await onDataChanged();
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Error al guardar reparación.',
      });
    } finally {
      setBusy(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    setFeedback(null);
    try {
      if (confirmDelete.tab === 'locations') {
        await deleteLocationApi(confirmDelete.id);
      } else if (confirmDelete.tab === 'products') {
        await deleteProductApi(confirmDelete.id);
      } else {
        await deleteRepairApi(confirmDelete.id);
      }
      setFeedback({
        type: 'success',
        text: `Registro "${confirmDelete.label}" eliminado.`,
      });
      setConfirmDelete(null);
      await onDataChanged();
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'No se pudo eliminar el registro.',
      });
    } finally {
      setBusy(false);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredLocations = locations.filter(
    (l) =>
      !q ||
      `${l.name} ${l.address} ${l.category}`.toLowerCase().includes(q)
  );
  const filteredProducts = products.filter(
    (p) =>
      !q ||
      `${p.name} ${p.brand} ${p.bike_type} ${p.item_type}`
        .toLowerCase()
        .includes(q)
  );
  const filteredRepairs = repairs.filter(
    (r) =>
      !q ||
      `${r.service_name} ${r.service_category} ${r.bike_type}`
        .toLowerCase()
        .includes(q)
  );

  return (
    <section aria-label="Gestión CRUD de registros" className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Gestión de catálogo y registros
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Altas, bajas y modificaciones sincronizadas con el mapa interactivo
            y el asistente inteligente Gemini.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Almacenamiento:{' '}
            <strong className="font-medium text-slate-800">
              {storageMode === 'supabase'
                ? 'Supabase PostgreSQL'
                : 'Base local persistente (lista para Supabase)'}
            </strong>
          </span>
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo registro</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl border text-sm flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline ml-4"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'locations' as const, label: `Locales (${locations.length})` },
            {
              id: 'products' as const,
              label: `Bicicletas y accesorios (${products.length})`,
            },
            {
              id: 'repairs' as const,
              label: `Reparaciones y tarifas (${repairs.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative md:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar registros..."
            aria-label="Filtrar registros en gestión CRUD"
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'locations' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Dirección y contacto</th>
                  <th className="py-3 px-4">Coordenadas</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {loc.name}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 capitalize">
                      {loc.category}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{loc.address}</div>
                      <div className="font-mono text-slate-500 mt-0.5">
                        {loc.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span
                        className={
                          loc.available
                            ? 'text-emerald-700 font-medium'
                            : 'text-amber-700 font-medium'
                        }
                      >
                        {loc.available ? 'Disponible' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setLocationModal({
                            open: true,
                            editingId: loc.id,
                            name: loc.name,
                            category: loc.category,
                            address: loc.address,
                            phone: loc.phone,
                            email: loc.email,
                            hours: loc.hours,
                            latitude: String(loc.latitude),
                            longitude: String(loc.longitude),
                            description: loc.description,
                            bikeTypes: loc.bike_types_supported.join(', '),
                            servicesSummary: loc.services_summary.join(', '),
                            available: loc.available,
                          })
                        }
                        aria-label={`Editar ${loc.name}`}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({
                            tab: 'locations',
                            id: loc.id,
                            label: loc.name,
                          })
                        }
                        aria-label={`Eliminar ${loc.name}`}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'products' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Clasificación</th>
                  <th className="py-3 px-4">Local</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4 text-right">Precio</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((prod) => {
                  const locName =
                    locations.find((l) => l.id === prod.location_id)?.name ??
                    '—';
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {prod.name}
                        </div>
                        <div className="text-xs text-slate-500">{prod.brand}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {prod.item_type === 'bicicleta'
                          ? 'Bicicleta'
                          : 'Accesorio'}{' '}
                        · {prod.bike_type}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {locName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700">
                        {prod.stock}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        ${prod.price.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setProductModal({
                              open: true,
                              editingId: prod.id,
                              location_id: prod.location_id,
                              item_type: prod.item_type,
                              name: prod.name,
                              brand: prod.brand,
                              bike_type: prod.bike_type,
                              price: String(prod.price),
                              stock: String(prod.stock),
                              specs: prod.specs,
                              available: prod.available,
                            })
                          }
                          aria-label={`Editar ${prod.name}`}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              tab: 'products',
                              id: prod.id,
                              label: prod.name,
                            })
                          }
                          aria-label={`Eliminar ${prod.name}`}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'repairs' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Servicio</th>
                  <th className="py-3 px-4">Categoría · Bicicleta</th>
                  <th className="py-3 px-4">Local</th>
                  <th className="py-3 px-4 text-right">Duración</th>
                  <th className="py-3 px-4 text-right">Tarifa</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRepairs.map((rep) => {
                  const locName =
                    locations.find((l) => l.id === rep.location_id)?.name ?? '—';
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {rep.service_name}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {rep.service_category} · {rep.bike_type}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {locName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600">
                        {rep.estimated_minutes} min
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        ${rep.price.toFixed(2)} USD
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setRepairModal({
                              open: true,
                              editingId: rep.id,
                              location_id: rep.location_id,
                              service_name: rep.service_name,
                              service_category: rep.service_category,
                              bike_type: rep.bike_type,
                              price: String(rep.price),
                              estimated_minutes: String(rep.estimated_minutes),
                              description: rep.description,
                              available: rep.available,
                            })
                          }
                          aria-label={`Editar ${rep.service_name}`}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              tab: 'repairs',
                              id: rep.id,
                              label: rep.service_name,
                            })
                          }
                          aria-label={`Eliminar ${rep.service_name}`}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Confirmar eliminación
            </h3>
            <p className="text-sm text-slate-600">
              ¿Deseas eliminar <strong>{confirmDelete.label}</strong>? Esta
              acción actualiza la base de datos de inmediato.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Create/Edit Modal */}
      {locationModal.open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveLocation}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {locationModal.editingId ? 'Editar local' : 'Nuevo local'}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setLocationModal((prev) => ({ ...prev, open: false }))
                }
                aria-label="Cerrar formulario"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre del local
                </label>
                <input
                  required
                  value={locationModal.name}
                  onChange={(e) =>
                    setLocationModal((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={locationModal.category}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      category: e.target.value as LocationCategory,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="tienda">Tienda</option>
                  <option value="taller">Taller</option>
                  <option value="estacion">Estación de servicio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  required
                  value={locationModal.phone}
                  onChange={(e) =>
                    setLocationModal((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dirección completa
                </label>
                <input
                  required
                  value={locationModal.address}
                  onChange={(e) =>
                    setLocationModal((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Latitud
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  value={locationModal.latitude}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      latitude: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Longitud
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  value={locationModal.longitude}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      longitude: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={locationModal.email}
                  onChange={(e) =>
                    setLocationModal((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Horarios
                </label>
                <input
                  value={locationModal.hours}
                  onChange={(e) =>
                    setLocationModal((p) => ({ ...p, hours: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipos de bicicleta (separados por coma)
                </label>
                <input
                  value={locationModal.bikeTypes}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      bikeTypes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Servicios principales (separados por coma)
                </label>
                <input
                  value={locationModal.servicesSummary}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      servicesSummary: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={locationModal.description}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={locationModal.available}
                  onChange={(e) =>
                    setLocationModal((p) => ({
                      ...p,
                      available: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Local disponible / operativo</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setLocationModal((p) => ({ ...p, open: false }))
                }
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? 'Guardando...' : 'Guardar local'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Create/Edit Modal */}
      {productModal.open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveProduct}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {productModal.editingId
                  ? 'Editar producto'
                  : 'Nuevo producto del catálogo'}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setProductModal((p) => ({ ...p, open: false }))
                }
                aria-label="Cerrar formulario"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo de ítem
                </label>
                <select
                  value={productModal.item_type}
                  onChange={(e) =>
                    setProductModal((p) => ({
                      ...p,
                      item_type: e.target.value as ProductItemType,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="bicicleta">Bicicleta</option>
                  <option value="accesorio">Accesorio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Local / Tienda
                </label>
                <select
                  required
                  value={productModal.location_id}
                  onChange={(e) =>
                    setProductModal((p) => ({
                      ...p,
                      location_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre del modelo o accesorio
                </label>
                <input
                  required
                  value={productModal.name}
                  onChange={(e) =>
                    setProductModal((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Marca
                </label>
                <input
                  required
                  value={productModal.brand}
                  onChange={(e) =>
                    setProductModal((p) => ({ ...p, brand: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo de bicicleta / categoría
                </label>
                <input
                  required
                  value={productModal.bike_type}
                  onChange={(e) =>
                    setProductModal((p) => ({
                      ...p,
                      bike_type: e.target.value,
                    }))
                  }
                  placeholder="Urbana, Montaña, Seguridad..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Precio (USD)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={productModal.price}
                  onChange={(e) =>
                    setProductModal((p) => ({ ...p, price: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Stock disponible
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={productModal.stock}
                  onChange={(e) =>
                    setProductModal((p) => ({ ...p, stock: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Especificaciones técnicas
                </label>
                <textarea
                  rows={2}
                  value={productModal.specs}
                  onChange={(e) =>
                    setProductModal((p) => ({ ...p, specs: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={productModal.available}
                  onChange={(e) =>
                    setProductModal((p) => ({
                      ...p,
                      available: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Visible y disponible en catálogo</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setProductModal((p) => ({ ...p, open: false }))
                }
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Repair Create/Edit Modal */}
      {repairModal.open && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveRepair}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {repairModal.editingId
                  ? 'Editar reparación o tarifa'
                  : 'Nueva reparación o tarifa'}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setRepairModal((p) => ({ ...p, open: false }))
                }
                aria-label="Cerrar formulario"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Taller / Estación
                </label>
                <select
                  required
                  value={repairModal.location_id}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      location_id: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre del servicio
                </label>
                <input
                  required
                  value={repairModal.service_name}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      service_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Categoría de servicio
                </label>
                <select
                  value={repairModal.service_category}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      service_category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="Neumáticos">Neumáticos</option>
                  <option value="Frenos">Frenos</option>
                  <option value="Transmisión">Transmisión</option>
                  <option value="Suspensión">Suspensión</option>
                  <option value="Eléctrica">Eléctrica</option>
                  <option value="Mantenimiento General">
                    Mantenimiento General
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo de bicicleta
                </label>
                <select
                  value={repairModal.bike_type}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      bike_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                >
                  <option value="Todas">Todas</option>
                  <option value="Urbana">Urbana</option>
                  <option value="Montaña">Montaña</option>
                  <option value="Gravel">Gravel</option>
                  <option value="Ruta">Ruta</option>
                  <option value="Eléctrica">Eléctrica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tarifa (USD)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={repairModal.price}
                  onChange={(e) =>
                    setRepairModal((p) => ({ ...p, price: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Duración estimada (minutos)
                </label>
                <input
                  required
                  type="number"
                  min="5"
                  value={repairModal.estimated_minutes}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      estimated_minutes: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Descripción del trabajo
                </label>
                <textarea
                  rows={2}
                  value={repairModal.description}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={repairModal.available}
                  onChange={(e) =>
                    setRepairModal((p) => ({
                      ...p,
                      available: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Servicio disponible actualmente</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setRepairModal((p) => ({ ...p, open: false }))
                }
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? 'Guardando...' : 'Guardar servicio'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
