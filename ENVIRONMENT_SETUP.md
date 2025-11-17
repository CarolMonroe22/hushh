# 🌍 Configuración de Variables de Entorno - Hushh

## 📋 Variables Requeridas

Tu aplicación Hushh requiere las siguientes variables de entorno para funcionar correctamente:

### Frontend (Vite)

```env
VITE_SUPABASE_PROJECT_ID="tu_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="tu_anon_key"
VITE_SUPABASE_URL="https://tu-project.supabase.co"
```

### Backend (Supabase Edge Functions)

```env
ELEVENLABS_API_KEY="sk_tu_api_key"
SUPABASE_URL="https://tu-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key"
```

---

## 🚀 Configuración en Lovable Cloud

### 1. Variables de Entorno en Lovable Dashboard

1. **Accede a tu proyecto:**
   - URL: https://lovable.dev/projects/9998cf32-2dd2-4880-8c79-cd1f6b36cdb8
   - Ve a **Settings** → **Environment Variables**

2. **Agrega las variables del frontend:**
   ```
   Nombre: VITE_SUPABASE_PROJECT_ID
   Valor: [tu project ID de Supabase]

   Nombre: VITE_SUPABASE_PUBLISHABLE_KEY
   Valor: [tu anon key de Supabase]

   Nombre: VITE_SUPABASE_URL
   Valor: [tu URL de Supabase]
   ```

3. **Re-deploy tu aplicación:**
   - Lovable automáticamente re-deployará con las nuevas variables
   - O usa el botón "Redeploy" en el dashboard

---

## 💻 Configuración para Desarrollo Local

### 1. Crear archivo .env local

```bash
# Copia el template
cp .env.example .env

# Edita con tus credenciales de desarrollo
nano .env  # o tu editor favorito
```

### 2. Obtener credenciales de Supabase

1. **Ve a Supabase Dashboard:**
   - https://app.supabase.com/project/wpurfvvpxnhwuvmimhoi/settings/api

2. **Copia las credenciales:**
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API Key (anon public)** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Project Reference ID** → `VITE_SUPABASE_PROJECT_ID`

3. **Pega en tu `.env` local:**
   ```env
   VITE_SUPABASE_PROJECT_ID="wpurfvvpxnhwuvmimhoi"
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
   VITE_SUPABASE_URL="https://wpurfvvpxnhwuvmimhoi.supabase.co"
   ```

### 3. Instalar dependencias y ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

---

## 🔧 Configuración de Supabase Edge Functions

Las Edge Functions necesitan sus propias variables de entorno configuradas directamente en Supabase.

### 1. Usando Supabase CLI

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Login a Supabase
supabase login

# Vincular tu proyecto
supabase link --project-ref wpurfvvpxnhwuvmimhoi

# Configurar secretos
supabase secrets set ELEVENLABS_API_KEY="sk_tu_api_key_aqui"
```

### 2. Usando Supabase Dashboard

1. **Ve a Edge Functions:**
   - https://app.supabase.com/project/wpurfvvpxnhwuvmimhoi/functions

2. **Configurar secretos:**
   - Click en "Manage secrets"
   - Agrega: `ELEVENLABS_API_KEY`
   - Valor: Tu API key de ElevenLabs

3. **Re-deploy las funciones:**
   ```bash
   supabase functions deploy generate-custom-asmr
   supabase functions deploy generate-binaural-experience
   supabase functions deploy generate-voice-journey
   supabase functions deploy whisper-text
   # ... y todas las demás funciones
   ```

---

## 🔑 Obtener API Keys

### Supabase

1. **Dashboard:** https://app.supabase.com/
2. **Tu Proyecto:** wpurfvvpxnhwuvmimhoi
3. **Settings → API:**
   - Anon/Public Key (para frontend)
   - Service Role Key (para backend/funciones)

### ElevenLabs

1. **Dashboard:** https://elevenlabs.io/app/settings/api-keys
2. **Crear nueva API key** (si no tienes una)
3. **Copiar y guardar de forma segura**

---

## ✅ Verificación

### Checklist de Variables Configuradas

**Desarrollo Local:**
- [ ] Archivo `.env` creado
- [ ] `VITE_SUPABASE_PROJECT_ID` configurado
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configurado
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `npm run dev` funciona correctamente

**Lovable Cloud (Producción):**
- [ ] Variables configuradas en Lovable Dashboard
- [ ] Aplicación re-deployada
- [ ] Producción funciona correctamente

**Supabase Edge Functions:**
- [ ] `ELEVENLABS_API_KEY` configurado en Supabase Secrets
- [ ] Funciones re-deployadas
- [ ] Generación de audio funciona en producción

---

## 🚨 Troubleshooting

### Error: "supabase is not defined"

**Causa:** Variables de entorno no cargadas.

**Solución:**
```bash
# Verifica que el archivo .env existe
ls -la .env

# Verifica que las variables tienen el prefijo VITE_
cat .env

# Reinicia el servidor de desarrollo
npm run dev
```

### Error: "Invalid API key" en Edge Functions

**Causa:** `ELEVENLABS_API_KEY` no configurado en Supabase.

**Solución:**
```bash
supabase secrets set ELEVENLABS_API_KEY="sk_tu_key_real"
supabase functions deploy nombre-de-la-funcion
```

### Error: "Failed to fetch" en producción (Lovable)

**Causa:** Variables no configuradas en Lovable Dashboard.

**Solución:**
1. Ve a Lovable Dashboard → Settings → Environment Variables
2. Agrega todas las variables `VITE_*`
3. Re-deploy la aplicación

---

## 🔒 Mejores Prácticas

### ✅ DO (Hacer):

- ✅ Usar diferentes API keys para desarrollo y producción
- ✅ Mantener `.env` en `.gitignore`
- ✅ Usar `.env.example` como documentación
- ✅ Rotar credenciales regularmente
- ✅ Usar Supabase Secrets para Edge Functions
- ✅ Configurar variables en Lovable Dashboard para producción

### ❌ DON'T (No hacer):

- ❌ Commitear archivos `.env` a Git
- ❌ Compartir API keys en chat/email
- ❌ Hardcodear credenciales en el código
- ❌ Usar las mismas keys en todos los ambientes
- ❌ Exponer Service Role Keys en el frontend

---

## 📊 Arquitectura de Variables

```
┌─────────────────────────────────────────────────────────┐
│                   HUSHH APPLICATION                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  DESARROLLO LOCAL                                       │
│  ├── .env (local, gitignored)                          │
│  │   ├── VITE_SUPABASE_*                               │
│  │   └── [Leído por Vite en build time]               │
│  │                                                      │
│  └── npm run dev                                        │
│      └── http://localhost:5173                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PRODUCCIÓN (LOVABLE CLOUD)                            │
│  ├── Lovable Dashboard Environment Variables           │
│  │   ├── VITE_SUPABASE_PROJECT_ID                     │
│  │   ├── VITE_SUPABASE_PUBLISHABLE_KEY                │
│  │   └── VITE_SUPABASE_URL                            │
│  │                                                      │
│  └── Deploy automático                                  │
│      └── https://tu-app.lovable.app                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  SUPABASE EDGE FUNCTIONS                               │
│  ├── Supabase Secrets (CLI o Dashboard)                │
│  │   ├── ELEVENLABS_API_KEY                           │
│  │   ├── SUPABASE_URL (auto-inyectado)                │
│  │   └── SUPABASE_SERVICE_ROLE_KEY (auto-inyectado)   │
│  │                                                      │
│  └── supabase functions deploy                          │
│      └── https://*.supabase.co/functions/v1/*          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Referencias

- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-mode.html
- **Supabase Environment Variables:** https://supabase.com/docs/guides/cli/managing-environments
- **Lovable Documentation:** https://docs.lovable.dev/
- **ElevenLabs API Keys:** https://elevenlabs.io/docs/api-reference/authentication

---

**Última actualización:** 2025-11-17
