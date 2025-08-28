# Dinámica interactiva: Modelo en V — v1.6 (V real)

- **Disposición en V real** con conectores SVG (gris; tras validar: verde/rojo por pareja).
- Validación por `?map=BASE64_JSON` (sin respuestas quemadas) y **PIN docente** `?pin=XXXX`.
- **Link único de estudiantes** y **link docente** (admin) en ventanas separadas.
- **Feedback por celda** (verde/rojo), **puntaje por parejas**.
- **Sesiones** `?session=...` con panel **admin** (`&admin=1`) y export CSV/JSON.
- **Sink** `&sink=https://...` para recibir resultados por POST.

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
