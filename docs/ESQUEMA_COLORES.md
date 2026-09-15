# Esquema de colores — VeteriApp-web

La aplicación usa **Tailwind CSS v4** con variables CSS definidas en `src/app/globals.css`. Soporta **modo claro y modo oscuro** (`.dark`).

## Paleta principal (Brand) — Verde Clínico / Forest Sage

Color primario de la marca, usado en botones primarios, enlaces activos, foco de inputs y estados seleccionados. Transmite salud animal, rigor biomédico, naturaleza y serenidad.

| Token | Hex |
| --- | --- |
| brand-25 | `#f2f9f6` |
| brand-50 | `#e6f4ee` |
| brand-100 | `#cce8dc` |
| brand-200 | `#99d2ba` |
| brand-300 | `#66bb97` |
| brand-400 | `#33a575` |
| **brand-500** (primario) | **`#1b6b53`** |
| brand-600 (hover) | `#155642` |
| brand-700 | `#104333` |
| brand-800 | `#0c3227` |
| brand-900 | `#08221a` |
| brand-950 | `#04120e` |

## Neutros (Gray) — Textos y fondos

Base para tipografías, bordes, fondos de cards y modo oscuro.

| Token | Hex | Uso típico |
| --- | --- | --- |
| gray-25 | `#fcfcfd` | |
| gray-50 | `#f9fafb` | Fondo del body |
| gray-100 | `#f2f4f7` | Hover de menús |
| gray-200 | `#e4e7ec` | Bordes por defecto |
| gray-300 | `#d0d5dd` | Bordes de inputs |
| gray-400 | `#98a2b3` | Placeholders / texto secundario |
| gray-500 | `#667085` | Etiquetas en dark, iconos menú |
| gray-600 | `#475467` | |
| gray-700 | `#344054` | Texto de etiquetas / botones outline |
| gray-800 | `#1d2939` | Textos fuertes |
| gray-900 | `#101828` | Texto principal / fondo inputs dark |
| gray-950 | `#0c111d` | |
| gray-dark | `#1a2231` | Fondo de cards en dark |

## Estados

- **Success (verde)**: base `#12b76a` (500), rango 25–950 (`#f6fef9` → `#053321`)
- **Error (rojo)**: base `#f04438` (500), rango 25–950 (`#fffbfa` → `#55160c`)
- **Warning (naranja)**: base `#f79009` (500), rango 25–950 (`#fffcf5` → `#4e1d09`)
- **Blue-light (cian)**: base `#0ba5ec` (500), rango 25–950 (`#f5fbff` → `#062c41`)

## Colores de acento (theme)

- `theme-pink-500`: `#ee46bc`
- `theme-purple-500`: `#7a5af8`

## Tipografía

- **Fuente**: `Outfit, sans-serif` (variable `--font-outfit`)
- **Color de títulos**: `#101828` (gray-900) en claro · `#ffffff` en oscuro
- Tamaños de título: 72 / 60 / 48 / 36 / 30 px
- Texto tema: 20 / 14 / 12 px

---

## Componentes

### Botones (`src/components/ui/button/Button.tsx`)

- **Primary**: `bg-brand-500` `#465fff` · texto blanco · hover `bg-brand-600` `#3641f5` · disabled `bg-brand-300` `#9cb9ff`
- **Outline**: `bg-white` · texto `gray-700` `#344054` · ring `gray-300` `#d0d5dd` · hover `bg-gray-50`
  - Dark: `bg-gray-800`, texto `gray-400`, ring `gray-700`, hover `bg-white/[0.03]`
- Bordes: `rounded-lg`, sombra `shadow-theme-xs`
- Tamaños: `sm` (px-4 py-3), `md` (px-5 py-3.5)

### Formularios / Inputs (`src/components/form/input/InputField.tsx`)

- Borde por defecto: `gray-300` `#d0d5dd` · texto `gray-800`
- Foco: borde `brand-300` `#9cb9ff` + anillo `brand-500/10` (sombra `rgba(70,95,255,0.12)`)
- Error: borde `error-500` `#f04438` · texto `error-800` `#912018`
- Éxito: borde `success-400` `#32d583` · texto `success-500` `#12b76a`
- Disabled: texto `gray-500`, borde `gray-300`
- Dark: fondo `gray-900`, texto `white/90`, foco `brand-800`

### Etiquetas / Labels (`src/components/form/Label.tsx`)

- Texto `gray-700` `#344054` · tamaño `text-sm` (14px) · `font-medium`
- Dark: `gray-400` `#98a2b3`

### Hints (ayuda bajo inputs)

- Base: `gray-500` `#667085`
- Error: `error-500` `#f04438`
- Éxito: `success-500` `#12b76a`

### Tarjetas y superficies

- Fondo body: `gray-50` `#f9fafb` (claro) · `gray-dark` `#1a2231` (oscuro)
- Bordes de tarjetas: `gray-200` `#e4e7ec` (claro) · `gray-800` `#1d2939` (oscuro)

### Sombras temáticas

- `xs`: `0 1px 2px rgba(16,24,40,0.05)`
- `sm`: `0 1px 3px rgba(16,24,40,0.1)`
- `md`: `0 4px 8px / 0 2px 4px rgba(16,24,40,0.1/0.06)`
- `lg`: `0 12px 16px / 0 4px 6px rgba(16,24,40,0.08/0.03)`
- `xl`: `0 20px 24px / 0 8px 8px rgba(16,24,40,0.08/0.03)`
