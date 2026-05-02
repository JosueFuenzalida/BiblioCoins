# BiblioCoins — Guía de despliegue

## Estructura de archivos

```
familyapp/
├── index.html          ← Hub central (inicio)
├── manifest.json       ← Configuración PWA
├── sw.js               ← Service Worker (offline)
├── css/
│   └── style.css       ← Sistema de diseño completo
├── js/
│   └── core.js         ← Lógica y datos (localStorage)
├── assets/
│   └── icon.svg        ← Ícono de la app
└── pages/
    ├── boveda.html     ← Saldos, metas, conversión CLP
    ├── lectura.html    ← Registro de páginas y libros
    ├── disciplina.html ← Multas y arrepentimiento
    ├── mercado.html    ← Privilegios canjeables
    ├── equipo.html     ← Cofre, misiones, capitán
    ├── arbol.html      ← Árbol del conocimiento (SVG)
    └── admin.html      ← Configuración y perfiles
```

---

## Paso 1 — Probar localmente

Abre `index.html` en cualquier navegador moderno.
Todos los datos se guardan en `localStorage` del navegador.

---

## Paso 2 — Publicar como PWA

### Opción A: GitHub Pages (gratis)
1. Sube la carpeta `familyapp/` a un repositorio GitHub
2. Ve a **Settings → Pages → Source: main / root**
3. Tu app estará en `https://tuusuario.github.io/familyapp/`
4. En Chrome/Safari Android: **"Agregar a pantalla de inicio"** → queda como app

### Opción B: Netlify (gratis, 1 minuto)
1. Arrastra la carpeta `familyapp/` a netlify.com/drop
2. Te da una URL pública inmediata
3. Misma instalación desde el navegador móvil

### Iconos reales (recomendado antes de publicar)
Genera los PNGs en https://realfavicongenerator.net/ con el `icon.svg`
y reemplaza las referencias en `manifest.json`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

---

## Paso 3 — Convertir a APK (Android)

### Opción A: PWABuilder (Microsoft, gratis)
1. Ve a **pwabuilder.com**
2. Pega la URL de tu app publicada
3. Click **"Package for stores"**
4. Descarga el **APK** o el paquete para **Google Play**

### Opción B: Capacitor (más control)
```bash
npm install @capacitor/cli @capacitor/core
npx cap init BiblioCoins com.familia.bibliocoins
npx cap add android
cp -r familyapp/* public/
npx cap sync
npx cap open android   # requiere Android Studio
```

### Opción C: WebAPK automático (solo Chrome Android)
Si el manifest cumple los criterios de PWA, Chrome genera
un WebAPK automáticamente al instalar desde el navegador.
Criterios: HTTPS + manifest con iconos + service worker activo.

---

## Datos y privacidad

- **Todo se guarda localmente** en el dispositivo (localStorage)
- No hay servidor, no hay cuenta, no hay nube
- Usa **Exportar datos (JSON)** en Configuración para hacer backups
- El backup se puede restaurar desde cualquier dispositivo

---

## Próximas mejoras sugeridas

- [ ] Sincronización entre dispositivos (Firebase / Supabase)
- [ ] Notificaciones push (recordatorio de lectura diaria)
- [ ] Fotos de perfil para los niños
- [ ] Historial de libros con portadas (Open Library API)
- [ ] Modo oscuro
- [ ] Reportes semanales PDF
