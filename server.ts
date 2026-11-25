import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  createLocation,
  createProduct,
  createRepair,
  deleteLocation,
  deleteProduct,
  deleteRepair,
  isSupabaseConfigured,
  listLocations,
  listProducts,
  listRepairs,
  updateLocation,
  updateProduct,
  updateRepair,
} from './src/server/repository.ts';
import {
  type AssistantHistoryItem,
  runCyclingAssistant,
} from './src/server/geminiAssistant.ts';
import type { LocationCategory, ProductItemType } from './src/types/cycling.ts';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const PORT = Number(process.env.PORT) || 3000;

  // Public runtime config (never exposes private server secrets)
  app.get('/api/public-config', (_req, res) => {
    const mapsKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      '';
    res.json({
      googleMapsApiKey:
        mapsKey && mapsKey !== 'MY_GOOGLE_MAPS_API_KEY' ? mapsKey : '',
      storageMode: isSupabaseConfigured() ? 'supabase' : 'local',
    });
  });

  // ==========================================
  // LOCATIONS ENDPOINTS
  // ==========================================
  app.get('/api/locations', async (req, res) => {
    try {
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const category =
        typeof req.query.category === 'string' &&
        ['tienda', 'taller', 'estacion'].includes(req.query.category)
          ? (req.query.category as LocationCategory)
          : '';
      const bike_type =
        typeof req.query.bike_type === 'string'
          ? req.query.bike_type
          : undefined;
      const service =
        typeof req.query.service === 'string' ? req.query.service : undefined;
      const available =
        req.query.available === 'true'
          ? true
          : req.query.available === 'false'
            ? false
            : undefined;

      const data = await listLocations({
        search,
        category,
        bike_type,
        service,
        available,
      });
      res.json(data);
    } catch (error) {
      console.error('Error GET /api/locations:', error);
      res.status(500).json({ error: 'No se pudieron obtener los locales.' });
    }
  });

  app.post('/api/locations', async (req, res) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name ?? '').trim();
      const address = String(body.address ?? '').trim();
      const phone = String(body.phone ?? '').trim();
      const email = String(body.email ?? '').trim();
      const hours = String(body.hours ?? '').trim();
      const category = body.category as LocationCategory;
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);

      if (
        !name ||
        !address ||
        !phone ||
        !['tienda', 'taller', 'estacion'].includes(category) ||
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      ) {
        return res.status(400).json({
          error:
            'Faltan campos obligatorios o las coordenadas (latitud/longitud) no son válidas.',
        });
      }

      const created = await createLocation({
        name,
        category,
        address,
        phone,
        email: email || 'contacto@ruedalibre.local',
        hours: hours || 'Lun a Sáb 09:00 - 19:00',
        latitude,
        longitude,
        description: String(body.description ?? '').trim(),
        available: body.available !== false,
        bike_types_supported: Array.isArray(body.bike_types_supported)
          ? body.bike_types_supported.map(String)
          : ['Urbana'],
        services_summary: Array.isArray(body.services_summary)
          ? body.services_summary.map(String)
          : [],
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Error POST /api/locations:', error);
      res.status(500).json({ error: 'No se pudo registrar el local.' });
    }
  });

  app.put('/api/locations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body ?? {};
      const updates: Record<string, unknown> = {};

      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.category !== undefined) {
        if (!['tienda', 'taller', 'estacion'].includes(body.category)) {
          return res.status(400).json({ error: 'Categoría de local inválida.' });
        }
        updates.category = body.category;
      }
      if (body.address !== undefined)
        updates.address = String(body.address).trim();
      if (body.phone !== undefined) updates.phone = String(body.phone).trim();
      if (body.email !== undefined) updates.email = String(body.email).trim();
      if (body.hours !== undefined) updates.hours = String(body.hours).trim();
      if (body.description !== undefined)
        updates.description = String(body.description).trim();
      if (body.latitude !== undefined) {
        const lat = Number(body.latitude);
        if (Number.isNaN(lat))
          return res.status(400).json({ error: 'Latitud inválida.' });
        updates.latitude = lat;
      }
      if (body.longitude !== undefined) {
        const lng = Number(body.longitude);
        if (Number.isNaN(lng))
          return res.status(400).json({ error: 'Longitud inválida.' });
        updates.longitude = lng;
      }
      if (body.available !== undefined)
        updates.available = Boolean(body.available);
      if (Array.isArray(body.bike_types_supported)) {
        updates.bike_types_supported = body.bike_types_supported.map(String);
      }
      if (Array.isArray(body.services_summary)) {
        updates.services_summary = body.services_summary.map(String);
      }

      const updated = await updateLocation(id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Local no encontrado.' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error PUT /api/locations/:id:', error);
      res.status(500).json({ error: 'No se pudo actualizar el local.' });
    }
  });

  app.delete('/api/locations/:id', async (req, res) => {
    try {
      const removed = await deleteLocation(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: 'Local no encontrado.' });
      }
      res.json({ deleted: true });
    } catch (error) {
      console.error('Error DELETE /api/locations/:id:', error);
      res.status(500).json({ error: 'No se pudo eliminar el local.' });
    }
  });

  // ==========================================
  // PRODUCTS ENDPOINTS
  // ==========================================
  app.get('/api/products', async (req, res) => {
    try {
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const item_type =
        req.query.item_type === 'bicicleta' ||
        req.query.item_type === 'accesorio'
          ? (req.query.item_type as ProductItemType)
          : '';
      const bike_type =
        typeof req.query.bike_type === 'string'
          ? req.query.bike_type
          : undefined;
      const location_id =
        typeof req.query.location_id === 'string'
          ? req.query.location_id
          : undefined;
      const max_price =
        typeof req.query.max_price === 'string' && req.query.max_price !== ''
          ? Number(req.query.max_price)
          : undefined;
      const available =
        req.query.available === 'true'
          ? true
          : req.query.available === 'false'
            ? false
            : undefined;

      const data = await listProducts({
        search,
        item_type,
        bike_type,
        location_id,
        max_price,
        available,
      });
      res.json(data);
    } catch (error) {
      console.error('Error GET /api/products:', error);
      res.status(500).json({ error: 'No se pudieron obtener los productos.' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name ?? '').trim();
      const brand = String(body.brand ?? '').trim();
      const location_id = String(body.location_id ?? '').trim();
      const item_type = body.item_type as ProductItemType;
      const bike_type = String(body.bike_type ?? '').trim();
      const price = Number(body.price);
      const stock = Number(body.stock ?? 0);

      if (
        !name ||
        !brand ||
        !location_id ||
        !bike_type ||
        !['bicicleta', 'accesorio'].includes(item_type) ||
        Number.isNaN(price) ||
        price < 0
      ) {
        return res.status(400).json({
          error: 'Datos de producto incompletos o precio inválido.',
        });
      }

      const defaultImg =
        item_type === 'accesorio'
          ? '/src/assets/images/cycling_gear_safety_1795624886403.jpg'
          : bike_type === 'Montaña' || bike_type === 'Gravel'
            ? '/src/assets/images/bike_mtb_gravel_1795624886633.jpg'
            : '/src/assets/images/bike_urban_commuter_1795624885348.jpg';

      const created = await createProduct({
        location_id,
        item_type,
        name,
        brand,
        bike_type,
        price,
        stock: Number.isNaN(stock) ? 0 : Math.max(0, stock),
        available: body.available !== false,
        specs: String(body.specs ?? '').trim(),
        image_url: String(body.image_url ?? '').trim() || defaultImg,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Error POST /api/products:', error);
      res.status(500).json({ error: 'No se pudo crear el producto.' });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const body = req.body ?? {};
      const updates: Record<string, unknown> = {};
      if (body.location_id !== undefined)
        updates.location_id = String(body.location_id).trim();
      if (body.item_type !== undefined) {
        if (!['bicicleta', 'accesorio'].includes(body.item_type)) {
          return res.status(400).json({ error: 'Tipo de ítem inválido.' });
        }
        updates.item_type = body.item_type;
      }
      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.brand !== undefined) updates.brand = String(body.brand).trim();
      if (body.bike_type !== undefined)
        updates.bike_type = String(body.bike_type).trim();
      if (body.price !== undefined) {
        const price = Number(body.price);
        if (Number.isNaN(price) || price < 0)
          return res.status(400).json({ error: 'Precio inválido.' });
        updates.price = price;
      }
      if (body.stock !== undefined) {
        const stock = Number(body.stock);
        if (Number.isNaN(stock) || stock < 0)
          return res.status(400).json({ error: 'Stock inválido.' });
        updates.stock = stock;
      }
      if (body.available !== undefined)
        updates.available = Boolean(body.available);
      if (body.specs !== undefined) updates.specs = String(body.specs).trim();
      if (body.image_url !== undefined)
        updates.image_url = String(body.image_url).trim();

      const updated = await updateProduct(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error PUT /api/products/:id:', error);
      res.status(500).json({ error: 'No se pudo actualizar el producto.' });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const removed = await deleteProduct(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      res.json({ deleted: true });
    } catch (error) {
      console.error('Error DELETE /api/products/:id:', error);
      res.status(500).json({ error: 'No se pudo eliminar el producto.' });
    }
  });

  // ==========================================
  // REPAIRS ENDPOINTS
  // ==========================================
  app.get('/api/repairs', async (req, res) => {
    try {
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const service_category =
        typeof req.query.service_category === 'string'
          ? req.query.service_category
          : undefined;
      const bike_type =
        typeof req.query.bike_type === 'string'
          ? req.query.bike_type
          : undefined;
      const location_id =
        typeof req.query.location_id === 'string'
          ? req.query.location_id
          : undefined;
      const max_price =
        typeof req.query.max_price === 'string' && req.query.max_price !== ''
          ? Number(req.query.max_price)
          : undefined;
      const available =
        req.query.available === 'true'
          ? true
          : req.query.available === 'false'
            ? false
            : undefined;

      const data = await listRepairs({
        search,
        service_category,
        bike_type,
        location_id,
        max_price,
        available,
      });
      res.json(data);
    } catch (error) {
      console.error('Error GET /api/repairs:', error);
      res.status(500).json({ error: 'No se pudieron obtener las reparaciones.' });
    }
  });

  app.post('/api/repairs', async (req, res) => {
    try {
      const body = req.body ?? {};
      const location_id = String(body.location_id ?? '').trim();
      const service_name = String(body.service_name ?? '').trim();
      const service_category = String(body.service_category ?? '').trim();
      const bike_type = String(body.bike_type ?? 'Todas').trim();
      const price = Number(body.price);
      const estimated_minutes = Number(body.estimated_minutes ?? 30);

      if (
        !location_id ||
        !service_name ||
        !service_category ||
        Number.isNaN(price) ||
        price < 0
      ) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios o la tarifa es inválida.',
        });
      }

      const created = await createRepair({
        location_id,
        service_name,
        service_category,
        bike_type,
        price,
        estimated_minutes:
          Number.isNaN(estimated_minutes) || estimated_minutes <= 0
            ? 30
            : estimated_minutes,
        available: body.available !== false,
        description: String(body.description ?? '').trim(),
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Error POST /api/repairs:', error);
      res.status(500).json({ error: 'No se pudo registrar la reparación.' });
    }
  });

  app.put('/api/repairs/:id', async (req, res) => {
    try {
      const body = req.body ?? {};
      const updates: Record<string, unknown> = {};
      if (body.location_id !== undefined)
        updates.location_id = String(body.location_id).trim();
      if (body.service_name !== undefined)
        updates.service_name = String(body.service_name).trim();
      if (body.service_category !== undefined)
        updates.service_category = String(body.service_category).trim();
      if (body.bike_type !== undefined)
        updates.bike_type = String(body.bike_type).trim();
      if (body.price !== undefined) {
        const price = Number(body.price);
        if (Number.isNaN(price) || price < 0)
          return res.status(400).json({ error: 'Tarifa inválida.' });
        updates.price = price;
      }
      if (body.estimated_minutes !== undefined) {
        const mins = Number(body.estimated_minutes);
        if (Number.isNaN(mins) || mins <= 0)
          return res.status(400).json({ error: 'Tiempo estimado inválido.' });
        updates.estimated_minutes = mins;
      }
      if (body.available !== undefined)
        updates.available = Boolean(body.available);
      if (body.description !== undefined)
        updates.description = String(body.description).trim();

      const updated = await updateRepair(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ error: 'Reparación no encontrada.' });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error PUT /api/repairs/:id:', error);
      res.status(500).json({ error: 'No se pudo actualizar la reparación.' });
    }
  });

  app.delete('/api/repairs/:id', async (req, res) => {
    try {
      const removed = await deleteRepair(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: 'Reparación no encontrada.' });
      }
      res.json({ deleted: true });
    } catch (error) {
      console.error('Error DELETE /api/repairs/:id:', error);
      res.status(500).json({ error: 'No se pudo eliminar la reparación.' });
    }
  });

  // ==========================================
  // GEMINI SMART ASSISTANT ENDPOINT
  // ==========================================
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const message = String(req.body?.message ?? '').trim();
      const history = Array.isArray(req.body?.history)
        ? (req.body.history as AssistantHistoryItem[])
        : [];

      if (!message) {
        return res
          .status(400)
          .json({ error: 'Escribe una consulta para el asistente.' });
      }

      const result = await runCyclingAssistant(message, history);
      res.json(result);
    } catch (error) {
      console.error('Error POST /api/assistant/chat:', error);
      const msg =
        error instanceof Error
          ? error.message
          : 'Error al consultar el asistente inteligente.';
      res.status(500).json({ error: msg });
    }
  });

  // Vite middleware (dev) or static dist serving (production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RuedaLibre server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
