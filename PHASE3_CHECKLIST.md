# ✅ Phase 3 Integration Checklist

**Objetivo:** Reducir Index.tsx de 2,267 líneas a <400 líneas

**Fecha Inicio:** __________
**Fecha Completado:** __________

---

## 🚀 Quick Start (30 minutos)

- [ ] **✓** Crear backup branch
  ```bash
  git checkout -b backup/before-phase3-integration
  git checkout claude/review-application-01F49TcrLizZhCygQiSESN8X
  ```
  **Tiempo estimado:** 2 min

- [ ] **✓** Instalar dependencias
  ```bash
  npm install
  ```
  **Tiempo estimado:** 5 min

- [ ] **✓** Verificar que el proyecto funciona
  ```bash
  npm run dev
  ```
  **Tiempo estimado:** 3 min
  **Verificar:** App carga en http://localhost:8080

- [ ] **✓** Migrar imports de constantes
  - Eliminar líneas 22-264 (definiciones de tipos y constantes)
  - Agregar imports desde `@/lib/constants/session-constants`
  **Tiempo estimado:** 10 min
  **Líneas ahorradas:** ~240 líneas

- [ ] **✓** Migrar AppHeader
  - Eliminar líneas del header (~líneas 1800-1950)
  - Reemplazar con componente `<AppHeader />`
  **Tiempo estimado:** 10 min
  **Líneas ahorradas:** ~150 líneas

**Total Quick Start: ~300 líneas reducidas en 30 minutos! 🎉**

---

## 📦 Paso 1: Preparación (1-2 horas)

- [ ] **1.1** Branch de backup creado
- [ ] **1.2** Dependencias instaladas
- [ ] **1.3** Tests funcionando
  ```bash
  npm test -- --run
  ```
- [ ] **1.4** Crear MIGRATION_PROGRESS.md
- [ ] **1.5** Leer Index.tsx completo (entender estructura)

**Notas:**
```
Líneas iniciales: 2,267
Target: <400
Reducción necesaria: >1,867 líneas (82%)
```

---

## 🔧 Paso 2: Integración de Constantes (15-30 min)

- [ ] **2.1** Eliminar type definitions (Mood, Ambient, etc.)
  - **Ubicación:** Líneas 22-25
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.2** Eliminar MOODS array
  - **Ubicación:** Líneas 27-34
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.3** Eliminar AMBIENTS array
  - **Ubicación:** Líneas 36-43
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.4** Eliminar BINAURAL_EXPERIENCES
  - **Ubicación:** Líneas 45-87
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.5** Eliminar VOICE_JOURNEYS
  - **Ubicación:** Líneas 89-169
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.6** Eliminar JOURNEY_VOICE_SETTINGS
  - **Ubicación:** Líneas 171-219
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.7** Eliminar VIBE_STARTERS
  - **Ubicación:** Líneas 221-250
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.8** Eliminar TITLE_ROTATIONS
  - **Ubicación:** Líneas 252-264
  - **Acción:** Eliminar, importar desde constants

- [ ] **2.9** Agregar import único al inicio
  ```typescript
  import {
    MOODS,
    AMBIENTS,
    BINAURAL_EXPERIENCES,
    VOICE_JOURNEYS,
    JOURNEY_VOICE_SETTINGS,
    VIBE_STARTERS,
    TITLE_ROTATIONS,
    type Mood,
    type Ambient,
    type BinauralExperience,
    type VoiceJourney,
  } from '@/lib/constants/session-constants';
  ```

- [ ] **2.10** Verificar que compila sin errores
  ```bash
  npm run dev
  ```

**Líneas ahorradas:** ~240 líneas ✅

---

## 🎨 Paso 3: Integración de Header/Landing (30-45 min)

- [ ] **3.1** Migrar RotatingHeroTitle
  - **Ubicación:** Buscar el JSX del hero title (línea ~1600)
  - **Acción:** Reemplazar con `<RotatingHeroTitle />`
  - **Importar:** `import { RotatingHeroTitle } from '@/components/landing';`
  - **Líneas ahorradas:** ~40 líneas

- [ ] **3.2** Migrar AppHeader
  - **Ubicación:** Buscar header JSX (línea ~1800-1950)
  - **Acción:** Reemplazar con:
    ```typescript
    <AppHeader
      user={user}
      onShowHistory={() => setShowHistory(true)}
      onNavigateToAccount={() => navigate('/account')}
      onSignOut={handleSignOut}
      onSignUp={() => setShowAuthModal(true)}
    />
    ```
  - **Importar:** `import { AppHeader } from '@/components/header';`
  - **Líneas ahorradas:** ~150 líneas

- [ ] **3.3** Eliminar función handleSignOut (ahora en parent)
  - **Nota:** Mantener la función, solo moverla si es necesario

- [ ] **3.4** Verificar header funciona
  - [ ] Sign up button visible (usuario no autenticado)
  - [ ] Avatar y menu visible (usuario autenticado)
  - [ ] History button funciona
  - [ ] Navigate to account funciona
  - [ ] Sign out funciona

**Líneas ahorradas:** ~190 líneas ✅
**Total acumulado:** ~430 líneas ✅

---

## 🎯 Paso 4: Session Creators (2-3 horas)

### 4.1 QuickPreset Component

- [ ] **4.1.1** Importar componente
  ```typescript
  import { QuickPreset } from '@/components/session-creators';
  ```

- [ ] **4.1.2** Buscar JSX de mood selector (línea ~1400-1500)

- [ ] **4.1.3** Buscar JSX de ambient selector (continúa después de mood)

- [ ] **4.1.4** Reemplazar con:
  ```typescript
  <QuickPreset
    selectedMood={selectedMood}
    selectedAmbient={selectedAmbient}
    onMoodChange={setSelectedMood}
    onAmbientChange={setSelectedAmbient}
    onGenerate={startSession}
    isGenerating={isGenerating}
  />
  ```

- [ ] **4.1.5** Verificar funcionalidad
  - [ ] Mood selection funciona
  - [ ] Ambient selection funciona
  - [ ] Generate button se habilita correctamente
  - [ ] Genera sesión correctamente
  - [ ] Audio se reproduce

**Líneas ahorradas:** ~150 líneas

### 4.2 CreatorMode Component

- [ ] **4.2.1** Importar componente
  ```typescript
  import { CreatorMode } from '@/components/session-creators';
  ```

- [ ] **4.2.2** Buscar vibe description textarea JSX

- [ ] **4.2.3** Buscar vibe starters buttons JSX

- [ ] **4.2.4** Reemplazar con:
  ```typescript
  <CreatorMode
    vibeDescription={vibeDescription}
    onDescriptionChange={setVibeDescription}
    onGenerate={startCreatorSession}
    isGenerating={isGenerating}
  />
  ```

- [ ] **4.2.5** Verificar funcionalidad
  - [ ] Textarea funciona
  - [ ] Vibe starters funcionan
  - [ ] Character counter visible
  - [ ] Validación de 20 caracteres funciona
  - [ ] Genera custom vibe correctamente

**Líneas ahorradas:** ~120 líneas

### 4.3 BinauralExperience Component

- [ ] **4.3.1** Importar componente
  ```typescript
  import { BinauralExperience } from '@/components/session-creators';
  ```

- [ ] **4.3.2** Buscar binaural experience selector JSX

- [ ] **4.3.3** Reemplazar con:
  ```typescript
  <BinauralExperience
    selectedExperience={selectedExperience}
    onExperienceChange={setSelectedExperience}
    onGenerate={startBinauralExperience}
    isGenerating={isGenerating}
  />
  ```

- [ ] **4.3.4** Verificar funcionalidad
  - [ ] Experience selection funciona
  - [ ] Genera binaural audio
  - [ ] 3D audio funciona con auriculares
  - [ ] Animation se ve correctamente

**Líneas ahorradas:** ~100 líneas

### 4.4 VoiceJourney Component

- [ ] **4.4.1** Importar componente
  ```typescript
  import { VoiceJourney } from '@/components/session-creators';
  ```

- [ ] **4.4.2** Buscar voice journey selector JSX

- [ ] **4.4.3** Buscar voice gender toggle JSX

- [ ] **4.4.4** Buscar ambient toggle y selector JSX

- [ ] **4.4.5** Reemplazar con:
  ```typescript
  <VoiceJourney
    selectedJourney={selectedJourney}
    voiceGender={voiceGender}
    withAmbient={withAmbient}
    ambientForJourney={ambientForJourney}
    onJourneyChange={setSelectedJourney}
    onVoiceGenderChange={setVoiceGender}
    onWithAmbientChange={setWithAmbient}
    onAmbientChange={setAmbientForJourney}
    onGenerate={startVoiceJourney}
    isGenerating={isGenerating}
  />
  ```

- [ ] **4.4.6** Verificar funcionalidad
  - [ ] Journey selection funciona
  - [ ] Voice gender toggle funciona
  - [ ] Ambient toggle funciona
  - [ ] Ambient selector aparece/desaparece
  - [ ] Genera voice journey correctamente
  - [ ] Audio con/sin ambient funciona

**Líneas ahorradas:** ~180 líneas

**Total session creators:** ~550 líneas ✅
**Total acumulado:** ~980 líneas ✅

---

## 🎵 Paso 5: Audio Player (2-3 horas)

### 5.1 Migrar a useAudioPlayer Hook

- [ ] **5.1.1** Importar hook
  ```typescript
  import { useAudioPlayer } from '@/hooks/useAudioPlayer';
  ```

- [ ] **5.1.2** Identificar estado de audio existente
  - [ ] isPlaying
  - [ ] isPaused
  - [ ] timeLeft
  - [ ] loopCount
  - [ ] audioRef
  - [ ] timerRef

- [ ] **5.1.3** Reemplazar con hook
  ```typescript
  const audioPlayer = useAudioPlayer({
    initialDuration: 60,
    loopEnabled,
    onComplete: () => setIsComplete(true),
    onLoopComplete: () => setLoopCount(prev => prev + 1),
  });
  ```

- [ ] **5.1.4** Actualizar referencias
  - Reemplazar `isPlaying` con `audioPlayer.isPlaying`
  - Reemplazar `isPaused` con `audioPlayer.isPaused`
  - Reemplazar `timeLeft` con `audioPlayer.timeLeft`
  - Reemplazar `loopCount` con `audioPlayer.loopCount`
  - Reemplazar `audioRef.current` con `audioPlayer.audioRef.current`

- [ ] **5.1.5** Eliminar funciones redundantes
  - [ ] Eliminar startTimer (en hook)
  - [ ] Eliminar stopTimer (en hook)
  - [ ] Eliminar handlePauseResume (usar audioPlayer.pause/resume)
  - [ ] Eliminar handleStop (usar audioPlayer.stop)
  - [ ] Eliminar handlePlay (usar audioPlayer.play)
  - [ ] Eliminar handleReplay (usar audioPlayer.replay)

**Líneas ahorradas:** ~200 líneas

### 5.2 AudioControls Component

- [ ] **5.2.1** Importar componente
  ```typescript
  import { AudioControls } from '@/components/audio-player';
  ```

- [ ] **5.2.2** Buscar JSX de controles de audio
  - Timer display
  - Play/Pause/Stop buttons
  - Loop toggle

- [ ] **5.2.3** Reemplazar con:
  ```typescript
  {(audioPlayer.isPlaying || audioPlayer.isPaused) && !isComplete && (
    <AudioControls
      isPlaying={audioPlayer.isPlaying}
      isPaused={audioPlayer.isPaused}
      loopEnabled={loopEnabled}
      loopCount={audioPlayer.loopCount}
      timeLeft={audioPlayer.timeLeft}
      generatedTitle={generatedTitle}
      needsManualPlay={needsManualPlay}
      onPlay={audioPlayer.play}
      onPauseResume={audioPlayer.isPaused ? audioPlayer.resume : audioPlayer.pause}
      onStop={audioPlayer.stop}
      onToggleLoop={() => setLoopEnabled(!loopEnabled)}
    />
  )}
  ```

- [ ] **5.2.4** Verificar funcionalidad
  - [ ] Timer cuenta regresiva
  - [ ] Play/Pause funciona
  - [ ] Stop funciona
  - [ ] Loop toggle funciona
  - [ ] Loop count se muestra

**Líneas ahorradas:** ~100 líneas

### 5.3 SessionComplete Component

- [ ] **5.3.1** Importar componente
  ```typescript
  import { SessionComplete } from '@/components/audio-player';
  ```

- [ ] **5.3.2** Buscar JSX de session complete
  - Session title
  - Feedback buttons
  - Waitlist form
  - Replay/New session buttons

- [ ] **5.3.3** Reemplazar con:
  ```typescript
  {isComplete && (
    <SessionComplete
      sessionTitle={generatedTitle}
      loopCount={audioPlayer.loopCount}
      onReplay={audioPlayer.replay}
      onNewSession={handleNewSession}
      onFeedback={(type) => setSessionFeedback(type)}
      onJoinWaitlist={handleWaitlistSubmit}
    />
  )}
  ```

- [ ] **5.3.4** Verificar funcionalidad
  - [ ] Muestra título de sesión
  - [ ] Feedback buttons funcionan
  - [ ] Waitlist form funciona
  - [ ] Replay funciona
  - [ ] New session funciona

**Líneas ahorradas:** ~120 líneas

**Total audio player:** ~420 líneas ✅
**Total acumulado:** ~1,400 líneas ✅

---

## 🧹 Paso 6: Limpieza (1-2 horas)

- [ ] **6.1** Eliminar imports no usados
  - Ejecutar ESLint para identificarlos
  - Remover manualmente

- [ ] **6.2** Eliminar estado no usado
  - Buscar variables que ya maneja el hook
  - Eliminar duplicados

- [ ] **6.3** Eliminar funciones duplicadas
  - Verificar que no haya helpers redundantes

- [ ] **6.4** Organizar imports por categoría
  - React
  - Router
  - UI components
  - Custom components
  - Hooks
  - Constants
  - Utils

- [ ] **6.5** Agregar comentarios de sección
  ```typescript
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // ============================================
  // SESSION GENERATION HANDLERS
  // ============================================

  // ============================================
  // RENDER
  // ============================================
  ```

- [ ] **6.6** Verificar líneas de código
  ```bash
  wc -l src/pages/Index.tsx
  ```
  **Target:** <400 líneas

**Líneas adicionales ahorradas:** ~100-200 líneas

---

## 🧪 Paso 7: Testing (3-4 horas)

### Manual Testing

- [ ] **7.1** Quick Preset Flow
  - [ ] Seleccionar mood
  - [ ] Seleccionar ambient
  - [ ] Generar sesión
  - [ ] Audio se reproduce
  - [ ] Timer funciona
  - [ ] Pause funciona
  - [ ] Resume funciona
  - [ ] Stop funciona
  - [ ] Completar sesión
  - [ ] Dar feedback
  - [ ] Replay funciona
  - [ ] New session funciona

- [ ] **7.2** Creator Mode Flow
  - [ ] Escribir descripción
  - [ ] Usar vibe starter
  - [ ] Generar custom vibe
  - [ ] Audio se reproduce
  - [ ] Funcionalidad completa

- [ ] **7.3** Binaural Experience Flow
  - [ ] Seleccionar experiencia
  - [ ] Generar sesión
  - [ ] 3D audio funciona (con auriculares)
  - [ ] Funcionalidad completa

- [ ] **7.4** Voice Journey Flow
  - [ ] Seleccionar journey
  - [ ] Toggle voice gender
  - [ ] Agregar ambient
  - [ ] Generar journey
  - [ ] Audio con ambient funciona
  - [ ] Funcionalidad completa

- [ ] **7.5** Session History
  - [ ] Ver historial
  - [ ] Reproducir desde historial
  - [ ] Favoritos funcionan
  - [ ] Eliminar funciona

- [ ] **7.6** Authentication Flow
  - [ ] Sign up funciona
  - [ ] Login funciona
  - [ ] Logout funciona
  - [ ] Protected routes funcionan

- [ ] **7.7** Responsive Testing
  - [ ] Desktop (>1024px)
  - [ ] Tablet (768-1024px)
  - [ ] Mobile (< 768px)

### Automated Testing

- [ ] **7.8** Escribir tests para componentes
  ```bash
  # QuickPreset
  touch src/components/session-creators/__tests__/QuickPreset.test.tsx

  # CreatorMode
  touch src/components/session-creators/__tests__/CreatorMode.test.tsx

  # AudioControls
  touch src/components/audio-player/__tests__/AudioControls.test.tsx

  # SessionComplete
  touch src/components/audio-player/__tests__/SessionComplete.test.tsx
  ```

- [ ] **7.9** Ejecutar todos los tests
  ```bash
  npm test -- --run
  ```

- [ ] **7.10** Verificar coverage
  ```bash
  npm run test:coverage
  ```
  **Target:** >50%

---

## 🚀 Paso 8: Optimización (2-3 horas)

- [ ] **8.1** Agregar React.memo
  ```typescript
  export const QuickPreset = memo(QuickPresetComponent);
  ```

- [ ] **8.2** Memoizar callbacks
  ```typescript
  const handleGenerate = useCallback(async () => {
    // ...
  }, [deps]);
  ```

- [ ] **8.3** Verificar re-renders
  - Usar React DevTools Profiler
  - Identificar componentes problemáticos

- [ ] **8.4** Build y verificar bundle
  ```bash
  npm run build
  ```
  **Target:** <500KB

- [ ] **8.5** Performance testing
  - Lighthouse audit
  - Verificar FCP, LCP, TTI

---

## 📚 Paso 9: Documentación (1-2 horas)

- [ ] **9.1** Actualizar REFACTORING_GUIDE.md
  - Marcar Fase 3 como completa
  - Actualizar métricas

- [ ] **9.2** Crear MIGRATION_NOTES.md
  - Documentar cambios importantes
  - Listar problemas encontrados

- [ ] **9.3** Actualizar README.md si es necesario

- [ ] **9.4** Crear PR description
  - Screenshots antes/después
  - Resumen de cambios
  - Testing realizado

---

## ✅ Pre-Commit Checklist

Antes de hacer commit final:

- [ ] `npm test -- --run` pasa ✅
- [ ] `npm run build` exitoso ✅
- [ ] `npm run lint` sin errores ✅
- [ ] Manual testing completo ✅
- [ ] Index.tsx <400 líneas ✅
- [ ] Sin console.logs ✅
- [ ] Sin TODOs críticos ✅
- [ ] Performance >= baseline ✅
- [ ] Documentación actualizada ✅

---

## 📊 Resumen de Progreso

| Paso | Descripción | Líneas Reducidas | Estado |
|------|-------------|------------------|--------|
| 1 | Preparación | 0 | ⬜ |
| 2 | Constantes | ~240 | ⬜ |
| 3 | Header/Landing | ~190 | ⬜ |
| 4 | Session Creators | ~550 | ⬜ |
| 5 | Audio Player | ~420 | ⬜ |
| 6 | Limpieza | ~200 | ⬜ |
| **TOTAL** | | **~1,600+** | **⬜** |

**Líneas iniciales:** 2,267
**Líneas target:** <400
**Reducción objetivo:** >1,867 líneas (82%)
**Reducción estimada:** ~1,600 líneas (71%)

---

## 🎯 Siguiente Acción

**La siguiente tarea es:**

1. Crear backup branch
2. Instalar dependencias
3. Empezar con Quick Start (30 min)

**Comando para empezar:**
```bash
git checkout -b backup/before-phase3-integration
git checkout claude/review-application-01F49TcrLizZhCygQiSESN8X
npm install
npm run dev
```

---

**Fecha última actualización:** 2025-11-17
**Estado:** Listo para Fase 3 ✅
