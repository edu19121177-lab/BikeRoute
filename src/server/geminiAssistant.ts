import { type Content, GoogleGenAI } from '@google/genai';
import {
  listLocations,
  listProducts,
  listRepairs,
} from './repository.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'La clave GEMINI_API_KEY no está configurada en el servidor.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface AssistantHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export async function runCyclingAssistant(
  message: string,
  history: AssistantHistoryItem[] = []
): Promise<{ reply: string; toolsUsed: string[] }> {
  const ai = getAiClient();

  // Fetch live records from Supabase / repository on every request
  const [locations, products, repairs] = await Promise.all([
    listLocations(),
    listProducts(),
    listRepairs(),
  ]);

  const locationMap = new Map(locations.map((l) => [l.id, l]));

  const liveSnapshot = {
    locales: locations.map((l) => ({
      nombre: l.name,
      categoria: l.category,
      direccion: l.address,
      telefono: l.phone,
      horario: l.hours,
      disponible: l.available,
      tipos_bicicleta: l.bike_types_supported,
      servicios: l.services_summary,
    })),
    productos: products.map((p) => ({
      tipo: p.item_type,
      nombre: p.name,
      marca: p.brand,
      categoria_o_tipo_bici: p.bike_type,
      precio_usd: p.price,
      stock: p.stock,
      disponible: p.available,
      especificaciones: p.specs,
      local: locationMap.get(p.location_id)?.name ?? 'Sede registrada',
      direccion_local: locationMap.get(p.location_id)?.address ?? '',
    })),
    reparaciones_y_tarifas: repairs.map((r) => ({
      servicio: r.service_name,
      categoria: r.service_category,
      tipo_bicicleta: r.bike_type,
      tarifa_usd: r.price,
      tiempo_estimado_min: r.estimated_minutes,
      disponible: r.available,
      descripcion: r.description,
      local: locationMap.get(r.location_id)?.name ?? 'Taller registrado',
      direccion_local: locationMap.get(r.location_id)?.address ?? '',
      telefono_local: locationMap.get(r.location_id)?.phone ?? '',
    })),
  };

  const systemInstruction = `Eres el asistente inteligente de RuedaLibre, un sistema de tiendas de bicicletas, talleres de reparación y estaciones de servicio ciclista.
Responde siempre en español claro, directo y amable, basándote EXCLUSIVAMENTE en los registros reales actuales de la base de datos incluidos a continuación:

REGISTROS EN TIEMPO REAL DE LA BASE DE DATOS:
${JSON.stringify(liveSnapshot)}

Reglas de respuesta:
1. Para consultas sobre talleres o reparaciones (ej. reparación de neumáticos), menciona exactamente los locales registrados que ofrecen el servicio, su dirección, teléfono, horario y tarifa en USD.
2. Para consultas sobre accesorios de seguridad, recomienda los elementos esenciales para circular de forma segura (casco, luces delantera y trasera, traba U-lock, chaleco reflectivo, kit de inflado/parches) detallando los productos reales del catálogo con precio en USD, stock y tienda donde retirarlos.
3. Para consultas sobre bicicletas según presupuesto: si el usuario indica un monto máximo, muestra las bicicletas cuyo precio_usd sea menor o igual; si no indica un monto específico, lista las bicicletas disponibles ordenadas de menor a mayor precio en USD e invítalo a indicar su presupuesto máximo para filtrar.
4. Nunca inventes locales, precios ni productos que no figuren en los registros reales.`;

  const contents: Content[] = history.slice(-8).map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: unknown;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction },
        });
        return {
          reply:
            response.text?.trim() ||
            'No pude generar una respuesta en este momento. Intenta reformular tu consulta.',
          toolsUsed: ['locales', 'productos', 'reparaciones'],
        };
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `Gemini ${modelName} (intento ${attempt + 1}) error:`,
          msg
        );
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429');
        if (!isTransient) {
          break;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 750 * (attempt + 1))
        );
      }
    }
  }

  const rawMsg =
    lastError instanceof Error ? lastError.message : String(lastError);
  if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE')) {
    throw new Error(
      'El servicio de Gemini está experimentando alta demanda temporal (503). Por favor, intenta nuevamente en unos segundos.'
    );
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Error al consultar la API de Gemini.');
}
