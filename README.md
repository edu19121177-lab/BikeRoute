# RuedaLibre — Sistema Web para Tiendas, Talleres y Estaciones Ciclistas

Sistema web dinámico construido con **React + TypeScript + Tailwind CSS**, **Express**, **Supabase (PostgreSQL)**, **Google Maps Platform** y **Google Gemini API** (`@google/genai`).

## Funcionalidades principales

- **Catálogo completo y búsqueda avanzada**: Locales (`tienda`, `taller`, `estacion`), bicicletas, accesorios de seguridad, reparaciones y tarifas con filtros por tipo de bicicleta, categoría de servicio, disponibilidad y precio.
- **Gestión CRUD completa**: Altas, bajas, modificaciones y consultas en tiempo real para locales, productos y reparaciones.
- **Mapa interactivo con Google Maps**: Más de 5 ubicaciones registradas con marcadores personalizados (`AdvancedMarker`) e `InfoWindow` con dirección, contacto, horarios, productos y tarifas del local.
- **Asistente inteligente con Gemini**: Chat interactivo conectado mediante *Function Calling* a los registros reales de la base de datos.
- **Diseño adaptable**: Interfaz responsiva para computadoras y dispositivos móviles.

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor**, ejecuta primero `supabase/schema.sql` y luego `supabase/seed.sql`.
3. Copia tus credenciales en las variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (usada exclusivamente en el servidor)
   - `SUPABASE_ANON_KEY`

*(Si estas variables no están definidas en desarrollo local, el servidor utiliza automáticamente un almacenamiento persistente local en `data/db.json` con los mismos datos iniciales para pruebas inmediatas).*

## Variables de entorno

Copia `.env.example` a `.env` y completa tus claves privadas (nunca subas `.env` a GitHub):

```env
GEMINI_API_KEY="tu_clave_de_gemini"
VITE_GOOGLE_MAPS_API_KEY="tu_clave_de_google_maps"
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
SUPABASE_ANON_KEY="tu_anon_key"
PORT="3000"
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Publicación en GitHub y Render

1. Inicializa o sube el repositorio a **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: RuedaLibre bike shops, maps, supabase and gemini assistant"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/ruedalibre.git
   git push -u origin main
   ```
2. En **Render**, crea un nuevo **Web Service** conectado al repositorio (o importa `render.yaml`):
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: agrega `NODE_ENV=production`, `GEMINI_API_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY`.
