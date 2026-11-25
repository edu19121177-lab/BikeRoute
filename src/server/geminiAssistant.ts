import {
  type Content,
  type FunctionDeclaration,
  GoogleGenAI,
  Type,
} from '@google/genai';
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

const searchWorkshopsAndRepairsDecl: FunctionDeclaration = {
  name: 'search_workshops_and_repairs',
  description:
    'Busca talleres, estaciones de servicio y tarifas de reparación reales en la base de datos según servicio (ej. neumáticos, frenos, transmisión, eléctrica), tipo de bicicleta o disponibilidad.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      service_keyword: {
        type: Type.STRING,
        description:
          'Palabra clave del servicio o categoría, por ejemplo: neumáticos, pinchadura, frenos, transmisión, eléctrica, suspensión.',
      },
      bike_type: {
        type: Type.STRING,
        description:
          'Tipo de bicicleta (Urbana, Montaña, Gravel, Ruta, Eléctrica, Plegable, Todas).',
      },
      only_available: {
        type: Type.BOOLEAN,
        description: 'Filtrar únicamente servicios y locales disponibles.',
      },
    },
  },
};

const searchCatalogProductsDecl: FunctionDeclaration = {
  name: 'search_catalog_products',
  description:
    'Consulta bicicletas y accesorios reales del catálogo de la base de datos, filtrando por tipo (bicicleta o accesorio), categoría/tipo de bicicleta, presupuesto máximo en USD y texto de búsqueda.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_type: {
        type: Type.STRING,
        description: 'Tipo de producto: "bicicleta" o "accesorio".',
      },
      bike_type: {
        type: Type.STRING,
        description:
          'Tipo de bicicleta o categoría de accesorio (Urbana, Montaña, Gravel, Eléctrica, Plegable, Seguridad, Iluminación, Herramientas).',
      },
      max_price: {
        type: Type.NUMBER,
        description: 'Presupuesto máximo en USD para filtrar productos.',
      },
      query: {
        type: Type.STRING,
        description: 'Texto libre para buscar por nombre, marca o especificaciones.',
      },
      only_available: {
        type: Type.BOOLEAN,
        description: 'Filtrar únicamente productos disponibles con stock.',
      },
    },
  },
};

const getAllLocationsOverviewDecl: FunctionDeclaration = {
  name: 'get_all_locations_overview',
  description:
    'Obtiene el listado completo de tiendas, talleres y estaciones ciclistas registradas con dirección, teléfono, horario, coordenadas y servicios.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Categoría opcional: tienda, taller o estacion.',
      },
    },
  },
};

async function executeToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (name === 'get_all_locations_overview') {
    const category =
      typeof args.category === 'string' &&
      ['tienda', 'taller', 'estacion'].includes(args.category)
        ? (args.category as 'tienda' | 'taller' | 'estacion')
        : '';
    const locations = await listLocations({ category });
    return { total: locations.length, locations };
  }

  if (name === 'search_workshops_and_repairs') {
    const serviceKeyword =
      typeof args.service_keyword === 'string' ? args.service_keyword : '';
    const bikeType =
      typeof args.bike_type === 'string' ? args.bike_type : '';
    const onlyAvailable =
      typeof args.only_available === 'boolean' ? args.only_available : undefined;

    const [locations, repairsBySearch, allRepairs] = await Promise.all([
      listLocations({ available: onlyAvailable }),
      listRepairs({
        search: serviceKeyword,
        bike_type: bikeType,
        available: onlyAvailable,
      }),
      listRepairs({ available: onlyAvailable }),
    ]);

    const matchedRepairs =
      repairsBySearch.length > 0
        ? repairsBySearch
        : allRepairs.filter((r) => {
            if (!serviceKeyword) return true;
            const q = serviceKeyword.toLowerCase();
            return (
              r.service_name.toLowerCase().includes(q) ||
              r.service_category.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q)
            );
          });

    const locationMap = new Map(locations.map((l) => [l.id, l]));

    const enriched = matchedRepairs
      .map((repair) => {
        const loc = locationMap.get(repair.location_id);
        return {
          repair_id: repair.id,
          service_name: repair.service_name,
          service_category: repair.service_category,
          bike_type: repair.bike_type,
          price_usd: repair.price,
          estimated_minutes: repair.estimated_minutes,
          available: repair.available,
          description: repair.description,
          location: loc
            ? {
                id: loc.id,
                name: loc.name,
                category: loc.category,
                address: loc.address,
                phone: loc.phone,
                hours: loc.hours,
                latitude: loc.latitude,
                longitude: loc.longitude,
              }
            : null,
        };
      })
      .filter((item) => item.location !== null);

    // Also include locations whose services_summary matches the keyword even without an individual repair row
    const matchingSummaryLocations = serviceKeyword
      ? locations.filter((loc) =>
          loc.services_summary.some((s) =>
            s.toLowerCase().includes(serviceKeyword.toLowerCase())
          )
        )
      : [];

    return {
      repairs_found: enriched,
      matching_locations: matchingSummaryLocations,
    };
  }

  if (name === 'search_catalog_products') {
    const itemType =
      typeof args.item_type === 'string' &&
      (args.item_type === 'bicicleta' || args.item_type === 'accesorio')
        ? args.item_type
        : '';
    const bikeType =
      typeof args.bike_type === 'string' ? args.bike_type : '';
    const maxPrice =
      typeof args.max_price === 'number' ? args.max_price : undefined;
    const query = typeof args.query === 'string' ? args.query : '';
    const onlyAvailable =
      typeof args.only_available === 'boolean' ? args.only_available : undefined;

    const [locations, products] = await Promise.all([
      listLocations(),
      listProducts({
        item_type: itemType,
        bike_type: bikeType,
        max_price: maxPrice,
        search: query,
        available: onlyAvailable,
      }),
    ]);

    const locationMap = new Map(locations.map((l) => [l.id, l]));
    const enriched = products.map((p) => {
      const loc = locationMap.get(p.location_id);
      return {
        ...p,
        price_usd: p.price,
        location_name: loc?.name ?? 'Local registrado',
        location_address: loc?.address ?? '',
        location_phone: loc?.phone ?? '',
      };
    });

    return {
      total: enriched.length,
      products: enriched,
    };
  }

  return { error: `Herramienta desconocida: ${name}` };
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
  const toolsUsed = new Set<string>();

  const systemInstruction = `Eres el asistente inteligente de RuedaLibre, una plataforma de tiendas de bicicletas, talleres de reparación y estaciones de servicio ciclista.
Responde siempre en español claro, práctico y conciso, basándote EXCLUSIVAMENTE en los registros reales obtenidos mediante tus herramientas de consulta a la base de datos.
Reglas importantes:
1. Siempre llama primero a las herramientas disponibles para consultar los registros reales antes de responder preguntas sobre talleres, reparaciones, tarifas, bicicletas o accesorios.
2. Si el usuario pregunta por reparaciones de neumáticos o servicios mecánicos, usa search_workshops_and_repairs e indica los nombres exactos de los locales, direcciones, horarios, teléfonos y tarifas en USD.
3. Si el usuario pregunta qué accesorios necesita para circular de forma segura, usa search_catalog_products (por ejemplo con item_type="accesorio") para recomendar tanto los elementos esenciales de seguridad vial (casco, luces delantera/trasera, traba U-lock, chaleco reflectivo, kit de inflado/parches) como los productos reales disponibles en el catálogo con su precio y tienda donde retirarlos.
4. Si el usuario pregunta qué bicicletas se ajustan a su presupuesto sin especificar un monto exacto, consulta todas las bicicletas disponibles con search_catalog_products(item_type="bicicleta") y preséntalas ordenadas de menor a mayor precio en USD junto con sus especificaciones y tienda, invitándolo también a indicar su monto máximo si desea filtrar aún más. Si sí indica un presupuesto, filtra con max_price.
5. Nunca inventes locales, direcciones, precios ni productos que no provengan de las herramientas.`;

  const contents: Content[] = history.slice(-8).map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  const config = {
    systemInstruction,
    tools: [
      {
        functionDeclarations: [
          searchWorkshopsAndRepairsDecl,
          searchCatalogProductsDecl,
          getAllLocationsOverviewDecl,
        ],
      },
    ],
  };

  async function generateWithRetry(
    requestContents: Content[]
  ) {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: requestContents,
          config,
        });
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429');
        if (!isTransient || attempt === 2) {
          throw err;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 700 * Math.pow(2, attempt))
        );
      }
    }
    throw lastError;
  }

  let response = await generateWithRetry(contents);

  for (let round = 0; round < 4; round++) {
    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      break;
    }

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) {
      contents.push(modelContent);
    }

    const functionResponseParts = [];
    for (const call of calls) {
      const fnName = call.name ?? '';
      toolsUsed.add(fnName);
      const args = (call.args as Record<string, unknown>) ?? {};
      const result = await executeToolCall(fnName, args);
      functionResponseParts.push({
        functionResponse: {
          id: call.id,
          name: fnName,
          response: { result },
        },
      });
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts,
    });

    response = await generateWithRetry(contents);
  }

  return {
    reply:
      response.text?.trim() ||
      'No pude generar una respuesta en este momento. Intenta reformular tu consulta.',
    toolsUsed: Array.from(toolsUsed),
  };
}
