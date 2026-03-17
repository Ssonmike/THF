# Nutri Week

Aplicacion web self-hosted para planificacion nutricional semanal de dos personas: Miguel y Ana.

El proyecto esta construido como un MVP real sobre Next.js App Router, TypeScript, Prisma y SQLite. La receta define el serving base y el planner semanal guarda las porciones concretas de cada persona para cada comida.

## Stack

- Next.js con App Router
- TypeScript
- CSS Modules + `app/globals.css`
- Prisma
- SQLite
- Zod
- date-fns
- Vitest para tests de logica critica

## Requisitos

- Node.js 22 o superior
- npm 10 o superior

## Instalacion

1. Instala dependencias:

```bash
npm install
```

2. Genera el cliente de Prisma:

```bash
npm run prisma:generate
```

3. Crea la base de datos con migracion inicial:

```bash
npm run prisma:migrate:dev -- --name init
```

4. Carga el seed:

```bash
npm run prisma:seed
```

5. Arranca la aplicacion:

```bash
npm run dev
```

La app quedara disponible en [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:seed`

Tambien existen aliases equivalentes para:

- `npm run "prisma generate"`
- `npm run "prisma migrate dev"`
- `npm run "prisma db seed"`

## Estructura

```text
app/
  page.tsx
  planner/
  recipes/
  shopping-list/
components/
  layout/
  planner/
  recipes/
  shopping/
  ui/
lib/
  constants/
  services/
  utils/
  validators/
prisma/
  schema.prisma
  seed.ts
tests/
```

## Modelo funcional

- `Recipe`: define ingredientes y nutricion por 1 serving estandar.
- `WeeklyPlan`: representa una semana concreta con inicio en Monday.
- `PlannedMeal`: asigna una receta a un dia + franja.
- `PlannedMealPortion`: guarda cuantos servings toma cada persona en esa comida concreta.

Esto permite:

- reutilizar la misma receta en dias diferentes
- calcular cantidades reales por persona
- generar lista de compra agregada
- sumar nutricion diaria sin duplicar recetas

## Decisiones tecnicas

- Borrado de recetas seguro: si una receta esta usada en el planner no se elimina.
- Persistencia real: SQLite a traves de Prisma, sin JSON como pseudo base de datos.
- Normalizacion de unidades limitada y predecible: `kg -> g` y `l -> ml`.
- Planner sin drag and drop: la edicion ocurre con formularios claros por slot.
- Mutaciones con Server Actions y validacion Zod.
- La logica critica vive fuera de JSX en `lib/services` y `lib/utils`.

## Tests

Se incluyen tests basicos para:

- agregacion de lista de la compra
- calculo nutricional por persona

Ejecucion:

```bash
npm run test
```

## Seed incluido

El seed crea:

- Personas: Miguel y Ana
- 5 recetas realistas
- 1 semana de ejemplo con varias comidas asignadas

## Despliegue self-hosted simple

### Opcion 1: VPS con Node

1. Copia el proyecto al servidor.
2. Ejecuta `npm install`.
3. Ejecuta `npm run prisma:generate`.
4. Ejecuta `npm run prisma:migrate:dev -- --name init` o la migracion correspondiente.
5. Ejecuta `npm run prisma:seed` si quieres datos iniciales.
6. Ejecuta `npm run build`.
7. Ejecuta `npm run start`.

Puedes ponerlo detras de Nginx o Caddy y gestionarlo con `pm2` o `systemd`.

### Opcion 2: Docker

La aplicacion no depende de servicios externos. Basta con persistir el archivo SQLite y exponer el puerto del proceso Next.js.

## Posibles mejoras fase 2

- categorias o tags de recetas
- vista mensual o historial de semanas
- exportacion de lista de compra
- notas persistentes de compra
- calculo de macros objetivo por persona
- duplicado de recetas
- soporte para mas personas

## Notas

- `.env` ya incluye `DATABASE_URL="file:./dev.db"`.
- El build ejecuta `prisma generate` antes de compilar.
- Si prefieres una base de datos diferente mas adelante, el modelo relacional ya esta preparado para crecer sin rehacer el dominio.
