# Dinámica interactiva: Modelo en V — v1.5

- Validación por `?map=BASE64_JSON` (sin respuestas quemadas).
- **PIN docente** `?pin=XXXX` y botón “Modo docente (PIN)”.
- **Link único para estudiantes** y **link de docente** (admin) en ventanas separadas.
- **Feedback por celda** (verde/rojo) y **puntaje corregido** (parejas correctas).
- **Sesiones** `?session=...` con panel **admin** (`&admin=1`) y export CSV/JSON.
- **Sink opcional** `&sink=https://...` para recibir resultados por POST.

## Local
```
npm install
npm run dev
```

## Generar enlaces en la app
- Estudiante: `?session=...&map=...`
- Docente: `?session=...&map=...&pin=XXXX&admin=1`

## GitHub Pages
```
npm run deploy
```
Activa en GitHub → **Settings → Pages** → rama `gh-pages`.
