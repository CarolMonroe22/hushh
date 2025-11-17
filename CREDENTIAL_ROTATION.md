# 🚨 ACCIÓN URGENTE REQUERIDA: Rotación de Credenciales

## ⚠️ Tu aplicación está comprometida

El archivo `.env` con credenciales sensibles estuvo expuesto en el repositorio Git. Esto significa que **cualquier persona con acceso al repositorio pudo ver**:

- Supabase Project ID: `wpurfvvpxnhwuvmimhoi`
- Supabase Anon/Public Key
- Supabase URL

**Debes rotar estas credenciales INMEDIATAMENTE.**

---

## 📋 Pasos de Rotación (Completar HOY)

### Paso 1: Rotar las API Keys de Supabase

#### 1.1 Acceder al Dashboard de Supabase

1. Ve a: https://app.supabase.com/
2. Selecciona tu proyecto: `wpurfvvpxnhwuvmimhoi`
3. Ve a **Settings** → **API**

#### 1.2 Generar Nuevas Keys

**Para la Anon Key (Public Key):**
```
⚠️ NOTA: Supabase no permite regenerar la anon key directamente.
Para seguridad máxima, considera crear un nuevo proyecto Supabase.
```

**Si decides continuar con el proyecto actual:**
- Revisa todos los logs de acceso en **Database** → **Logs**
- Verifica que no haya actividad sospechosa
- Monitorea por 48 horas

**Si decides crear un nuevo proyecto (RECOMENDADO):**
1. En Supabase Dashboard, crea un nuevo proyecto
2. Exporta tu esquema de base de datos actual:
   ```bash
   supabase db dump --schema public > backup_schema.sql
   ```
3. Migra los datos al nuevo proyecto
4. Actualiza las credenciales en `.env`

#### 1.3 Actualizar .env Local

Crea un nuevo archivo `.env` (ya está en .gitignore):

```bash
# Copia el template
cp .env.example .env

# Edita con tus NUEVAS credenciales
nano .env  # o usa tu editor favorito
```

Contenido del `.env`:
```env
VITE_SUPABASE_PROJECT_ID="tu_nuevo_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="tu_nueva_anon_key"
VITE_SUPABASE_URL="https://tu-nuevo-proyecto.supabase.co"
```

---

### Paso 2: Rotar las Keys de ElevenLabs (Si aplica)

Si tienes Edge Functions que usan ElevenLabs API:

1. Ve a: https://elevenlabs.io/app/settings/api-keys
2. Revoca la API key antigua
3. Genera una nueva API key
4. Actualiza en Supabase:
   ```bash
   supabase secrets set ELEVENLABS_API_KEY="tu_nueva_key"
   ```

---

### Paso 3: Revisar Actividad Sospechosa

#### 3.1 Supabase Database Logs

1. Ve a **Database** → **Logs** en Supabase Dashboard
2. Filtra por los últimos 30 días
3. Busca:
   - Inserciones/actualizaciones no autorizadas
   - Queries masivas de datos
   - Intentos de acceso desde IPs desconocidas

#### 3.2 Supabase Auth Logs

1. Ve a **Authentication** → **Logs**
2. Busca:
   - Intentos de login fallidos
   - Nuevas cuentas creadas sin tu conocimiento
   - Actividad de sesiones sospechosas

#### 3.3 Edge Functions Logs

1. Ve a **Edge Functions** → cada función → **Logs**
2. Busca:
   - Llamadas excesivas a APIs (ElevenLabs)
   - Errores de autenticación masivos
   - Patrones de uso inusuales

---

### Paso 4: Limpiar el Historial de Git (Opcional pero Recomendado)

**⚠️ ADVERTENCIA:** Esto reescribirá el historial de Git y requerirá force push.

Si tu repositorio es privado y trabajas solo, puedes limpiar el historial:

```bash
# Opción 1: Usar BFG Repo-Cleaner (Recomendado)
# Instalar BFG: https://rtyley.github.io/bfg-repo-cleaner/

# 1. Hacer backup
git clone --mirror https://github.com/CarolMonroe22/hushh.git hushh-backup.git

# 2. Limpiar .env del historial
bfg --delete-files .env hushh-backup.git

# 3. Limpiar referencias
cd hushh-backup.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push --force
```

```bash
# Opción 2: git filter-branch (Manual)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

**Si el repositorio es público o compartido:**
- Las credenciales ya están comprometidas permanentemente
- **DEBES** crear un nuevo proyecto Supabase
- No hay forma de "deshacer" la exposición pública

---

### Paso 5: Implementar Mejores Prácticas

#### 5.1 Verificar .gitignore

Asegúrate que `.gitignore` incluya:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

✅ Ya está configurado en este commit.

#### 5.2 Agregar Pre-commit Hook

Prevén futuros commits accidentales:

```bash
# Instalar pre-commit
pip install pre-commit

# Crear .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-added-large-files
      - id: detect-private-key
      - id: check-json
      - id: check-yaml
      - id: end-of-file-fixer
      - id: trailing-whitespace

  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF

# Instalar hooks
pre-commit install
```

#### 5.3 Usar Supabase Secrets para Edge Functions

En lugar de variables de entorno en archivos, usa Supabase Secrets:

```bash
# Configurar secrets
supabase secrets set ELEVENLABS_API_KEY="sk_..."
supabase secrets set OPENAI_API_KEY="sk_..."

# En tus Edge Functions
const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
```

---

### Paso 6: Notificar a tu Equipo (si aplica)

Si trabajas en equipo:
1. Notifica a todos los colaboradores
2. Pide que actualicen su `.env` local
3. Revisa los permisos de acceso al repositorio
4. Considera habilitar 2FA en GitHub

---

## ✅ Checklist de Verificación

Marca cada item cuando lo completes:

- [ ] He revisado los logs de Supabase por actividad sospechosa
- [ ] He rotado/creado nuevas credenciales de Supabase
- [ ] He actualizado mi `.env` local con las nuevas credenciales
- [ ] He rotado las API keys de ElevenLabs (si aplica)
- [ ] He verificado que `.env` está en `.gitignore`
- [ ] He confirmado que `.env` ya NO está en git tracking
- [ ] He probado que la aplicación funciona con las nuevas credenciales
- [ ] He considerado limpiar el historial de Git (opcional)
- [ ] He implementado pre-commit hooks (recomendado)
- [ ] He notificado a mi equipo (si aplica)

---

## 📊 Impacto de la Exposición

**Datos expuestos en commits anteriores:**
- Supabase Project ID: `wpurfvvpxnhwuvmimhoi`
- Supabase Anon Key: `eyJhbGci...` (JWT token válido)
- Supabase URL: `https://wpurfvvpxnhwuvmimhoi.supabase.co`

**Riesgos:**
- ✅ **Bajo riesgo** si el repositorio es privado y solo tú tienes acceso
- ⚠️ **Riesgo medio** si compartiste el repo con colaboradores
- 🚨 **Riesgo alto** si el repositorio fue público en algún momento
- 🚨 **Riesgo crítico** si el repo es público ahora

**Capacidades de un atacante con estas credenciales:**
- ✅ Leer datos públicos (permitido por RLS)
- ✅ Crear cuentas de usuario
- ✅ Ejecutar Edge Functions (consumir tu cuota de ElevenLabs)
- ❌ NO puede leer datos privados de otros usuarios (protegido por RLS)
- ❌ NO puede acceder al Service Role Key (no expuesto)
- ❌ NO puede modificar el esquema de la base de datos

---

## 🆘 ¿Necesitas Ayuda?

**Recursos:**
- Supabase Support: https://supabase.com/support
- Documentación de Seguridad: https://supabase.com/docs/guides/platform/security
- ElevenLabs Support: https://help.elevenlabs.io/

**Si detectas actividad sospechosa:**
1. Pausa/deshabilita el proyecto en Supabase inmediatamente
2. Contacta a Supabase Support
3. Revisa tus límites de billing
4. Considera reportar el incidente si hay abuso

---

## 📝 Notas Adicionales

**Este problema fue detectado el:** 2025-11-17

**Commits afectados:**
- Todos los commits previos que incluían el archivo `.env`
- Último commit con `.env`: Ver `git log -- .env`

**Acciones tomadas:**
- ✅ `.env` removido de git tracking
- ✅ `.env` agregado a `.gitignore`
- ✅ `.env.example` creado como template
- ⏳ Credenciales pendientes de rotación (TU RESPONSABILIDAD)

---

## 🔐 Recordatorios de Seguridad

**NUNCA:**
- ❌ Commitear archivos `.env` a Git
- ❌ Compartir credenciales en Slack/Discord/email
- ❌ Hardcodear API keys en el código
- ❌ Usar las mismas credenciales en dev y producción

**SIEMPRE:**
- ✅ Usar `.env.example` para documentación
- ✅ Rotar credenciales regularmente
- ✅ Usar diferentes keys por ambiente
- ✅ Habilitar 2FA en todas las cuentas
- ✅ Revisar logs de acceso periódicamente

---

**¿Preguntas?** Consulta el documento `REVIEW_HUSHH.md` para más detalles sobre seguridad.
