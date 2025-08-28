# Dinámica interactiva: Modelo en V — v1.7

- **Requisitos unificados** (sistema + software) en un solo slot.
- **Columna derecha reordenada**: Aceptación → Sistema → Integración → Unitaria.
- **Tablero en V real** con conectores (gris antes de validar; verde/rojo tras validar por pareja).
- **Nada “quemado”**: mapa de parejas por `?map=BASE64_JSON` (por defecto: `{"req":"t-acep","dis-arq":"t-sis","dis-mod":"t-int","cod":"t-unit"}`).
- Links separados **estudiante** y **docente** (PIN), sesiones y export CSV/JSON, sink opcional.

## Local
```
npm install
npm run dev
```

## Enlaces
- Estudiante: `?session=...&map=...`
- Docente: `?session=...&map=...&pin=XXXX&admin=1`

## GitHub Pages
```
npm run deploy
```
Activa en GitHub → **Settings → Pages** → rama `gh-pages`.
