---
name: AniDev
description: Catálogo oscuro y flexible para descubrir anime y contenido relacionado.
colors:
  brand-accent: "var(--brand-500)"
  neutral-950: "#121212"
  neutral-900: "#3d3d3d"
  neutral-800: "#454545"
  neutral-700: "#4f4f4f"
  neutral-600: "#5d5d5d"
  neutral-500: "#6d6d6d"
  neutral-400: "#888888"
  neutral-300: "#b0b0b0"
  neutral-200: "#d1d1d1"
  neutral-100: "#e7e7e7"
  neutral-50: "#f6f6f6"
  complementary: "#1c1c1c"
typography:
  body:
    fontFamily: "Nunito Sans, sans-serif"
  heading:
    fontFamily: "Kode Mono, ui-monospace, monospace"
  display:
    fontFamily: "Kode Mono, ui-monospace, monospace"
  label:
    fontFamily: "Kode Mono, ui-monospace, monospace"
rounded:
  md: "0.375rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "{spacing.xs}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "{spacing.xs}"
---

# Design System: AniDev

## Overview

**Creative North Star: "Libertad de exploración"**

AniDev debe sentirse cómodo, libre, versátil y bajo control de la persona. El
sistema actual usa una base oscura y serena para que el catálogo pueda crecer
sin volverse rígido ni administrativo. La interfaz acompaña el descubrimiento
con jerarquía editorial, controles reconocibles y espacio para que cada persona
elija su color de acento.

La profundidad se comunica principalmente con capas tonales. El acento es
expresivo, pero configurable, y debe reforzar acciones y estados sin quitarle
protagonismo al contenido.

**Key Characteristics:**

- Exploración cómoda y controlable.
- Base oscura con capas tonales cercanas.
- Acento expresivo y personalizable.
- Controles claros y confiables.

## Colors

La paleta combina neutros oscuros con una escala de acento definida por la
persona en configuración.

### Primary

- **Acento personal** (`var(--brand-500)`): acciones primarias, selección y
  señales de descubrimiento. El texto del botón primario debe mantener un
  contraste mínimo de 4.5:1 con su fondo; restringe los acentos seleccionables
  a valores compatibles con el foreground elegido o selecciona dinámicamente
  un foreground conforme.

### Neutral

- **Negro de aplicación** (`#121212`): fondo principal.
- **Superficie profunda** (`#1c1c1c`): superficie complementaria.
- **Grises de superficie** (`#3d3d3d` a `#6d6d6d`): capas, bordes y estados.
- **Grises de lectura** (`#888888` a `#f6f6f6`): texto secundario y principal.

### Named Rules

**The Personal Accent Rule.** El acento puede ser expresivo, pero el texto del
botón primario debe mantener un contraste mínimo de 4.5:1 con su fondo.
Restringe los acentos seleccionables a valores compatibles con el foreground
elegido o selecciona dinámicamente un foreground conforme; nunca renderices una
combinación que incumpla el contraste.

## Typography

**Body Font:** Nunito Sans (with sans-serif fallback)

**Heading / Display / Label Font:** Kode Mono (with monospace fallback)

**Character:** cercana y legible en el cuerpo; terminal y editorial en los
titulares. Dos familias en total: la mono grita y etiqueta (700 display,
400 labels), Nunito Sans lee.

### Hierarchy

- **Title** (bold, 32px to 50px, responsive): títulos principales de página.
- **Headline** (bold, 24px to 32px, responsive): secciones y grupos.
- **Body** (normal, 14px to 16px, responsive): información de catálogo.
- **Label** (light to medium, 10px to 20px, responsive): metadatos y controles.

## Layout

La aplicación usa una estructura de tres filas con navegación lateral de 80px
en escritorio. En pantallas de hasta 768px la navegación pasa debajo del
contenido y el layout se convierte en una sola columna. El espaciado parte de
incrementos compactos y aumenta en pantallas grandes.

## Elevation & Depth

El sistema es plano por defecto y comunica profundidad mediante superficies
tonales. Las sombras se reservan para estados interactivos, como hover, y no
deben convertirse en decoración permanente.

## Shapes

Los controles usan esquinas moderadamente redondeadas (`0.375rem`) y bordes
visibles en acciones primarias. El lenguaje debe permanecer accesible y
flexible, evitando siluetas excesivamente rígidas.

## Components

### Buttons

- **Shape:** esquinas moderadamente redondeadas (`0.375rem`).
- **Primary:** fondo de acento personal, texto blanco y borde de 2px.
- **Secondary:** fondo transparente, texto blanco y borde de 2px.
- **Hover / Focus:** transición breve; el primario puede volverse transparente
  con borde y texto de acento.
- **Candidates (conviven con las pills, no las reemplazan):**
  - **A `button-terminal`**: transparente, borde 1px, radio editorial;
    en hover invierte a claro (17.33:1 en ambos estados).
  - **B `button-hard`**: sólido `brand-700`, borde 2px, `shadow-hard-sm`;
    hover a `brand-800` (nunca `brand-600` con texto: 4.19:1).
  - **C `button-rule`**: solo texto `brand-300` con subrayado
    (10.42:1); para acciones terciarias editoriales.
  - **D `button-manifesto`**: sólido claro con texto oscuro (17.33:1);
    hover a `brand-700` (5.83:1).

### Navigation

- **Style:** lateral en escritorio y apilada en móvil; debe conservar el acceso
  al catálogo sin dominar la lectura.

### Cards / Containers

- **Background:** capas neutrales oscuras sobre el fondo principal.
- **Shadow Strategy:** profundidad tonal; sombra solo para estados.
- **Internal Padding:** compacto por defecto y ampliado en breakpoints grandes.

## Landing editorial (misma paleta dark + brand)

La landing copia el lenguaje de las refs sin importar sus colores: fondo
`#121212`, acento `brand`, texto `neutral-50`. Alcance: solo la ruta landing.

- **Type (dos familias):** display condensado mayúsculas en Kode Mono 700
  (10–15vw) + labels en Kode Mono 400 (nav, pills, placas `FIG. 01`,
  tickets, micro-labels 10–11px uppercase, tracking 0.18–0.2em).
  La línea de acento va en Kode Mono brand-300. Cuerpo en Nunito Sans.
- **Rules:** hairlines `neutral-800`, grid tenue, marcas de placa
  (`FIG. 01`), texto vertical en rieles laterales.
- **Shape:** tarjetas con borde 1–2px `neutral-700`, radio `2px`,
  sombra dura `4px 4px 0 brand-700`; pills solo para CTAs.
- **Bloque manifiesto:** panel sólido `brand-700` con display
  `neutral-50` (5.83:1); grano sutil sobre artwork, nunca sobre texto.

## Do's and Don'ts

### Do:

- **Do** preserve the user's accent-color choice across interactive states.
- **Do** use semantic HTML, visible focus, and readable contrast.
- **Do** keep discovery flexible through responsive layouts and clear hierarchy.

### Don't:

- **Don't** make the catalog feel like a rigid administrative table.
- **Don't** use decoration that competes with titles, artwork, or metadata.
- **Don't** assume one fixed accent color when the product supports customization.
