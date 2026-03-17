# Nutri Week

Nutri Week es una aplicacion web self-hosted para planificacion nutricional semanal de Miguel y Ana.

La receta define ingredientes y nutricion por 1 serving estandar. El planner semanal guarda cuanto come cada persona en cada slot. A partir de eso la app calcula dashboard diario, nutricion real y lista de la compra agregada con checklist persistente por semana.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- SQLite
- Zod
- CSS Modules
- Vitest

## Que incluye esta version

- CRUD de recetas con duplicado rapido
- planner semanal por slots
- servings independientes para Miguel y Ana
- guardado robusto con transacciones Prisma en planner
- duplicado de semana con confirmacion explicita al sobrescribir
- dashboard diario mas claro
- shopping list agregada con checklist persistente por semana
- filtros pendientes / todos / comprados
- exportacion CSV y copia al portapapeles desde la lista
- scripts de backup, restore y exportacion completa de datos
- Docker y Compose con volumen persistente
- paginas `error` y `not-found`

## Requisitos

- Node.js 22+
- npm 10+
- Docker opcional

## Instalacion local

1. Instala dependencias:

```bash
npm install
```

2. Genera Prisma Client:

```bash
npm run prisma:generate
```

3. Aplica migraciones:

```bash
npm run prisma:migrate:dev -- --name init
```

4. Carga datos de ejemplo:

```bash
npm run prisma:seed
```

5. Arranca desarrollo:

```bash
npm run dev
```

La app queda en [http://localhost:3000](http://localhost:3000).

## Desarrollo

- `npm run dev`
- `npm run lint`
- `npm run test`

## Produccion local

1. Genera build:

```bash
npm run build
```

2. Arranca en modo produccion:

```bash
npm run start
```

## Scripts utiles

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:seed`
- `npm run db:reset`
- `npm run backup`
- `npm run restore -- <ruta-al-backup.db>`
- `npm run export:data`
- `npm run docker:up`
- `npm run docker:down`

Tambien existen aliases:

- `npm run "prisma generate"`
- `npm run "prisma migrate dev"`
- `npm run "prisma db seed"`

## Ubicacion de la base de datos

En local, con la configuracion por defecto:

- `DATABASE_URL="file:./dev.db"`
- Prisma resuelve esa ruta relativa desde `prisma/schema.prisma`
- el fichero real acaba en `prisma/dev.db`

En Docker:

- la base vive en `/app/data/dev.db`
- el volumen `nutri_week_data` conserva los datos entre reinicios

## Checklist de compra persistente

La persistencia del checklist se guarda por semana en la tabla `ShoppingListItemState`.

Comportamiento:

- cada item se identifica por una clave normalizada `nombre + unidad`
- el estado se conserva al recargar
- al cambiar planner de esa semana, el estado se limpia de forma segura para evitar inconsistencias
- el estado esta aislado por `WeeklyPlan`

## Backup y restore

### Backup rapido

```bash
npm run backup
```

Esto copia la base SQLite actual a `backups/nutri-week-<timestamp>.db`.

### Restore

```bash
npm run restore -- backups/nutri-week-2026-03-17T10-00-00-000Z.db
```

Comportamiento del restore:

- crea un backup de seguridad del estado actual
- reemplaza la base activa por el fichero indicado

## Exportacion de datos

```bash
npm run export:data
```

Genera un JSON en `exports/` con:

- personas
- recetas e ingredientes
- semanas
- planned meals
- porciones
- estado persistente de shopping list

## Docker

### Arranque

```bash
npm run docker:up
```

o directamente:

```bash
docker compose up -d --build
```

### Parada

```bash
npm run docker:down
```

### Detalles

- `Dockerfile` compila y arranca Next.js en produccion
- `compose.yaml` crea un volumen persistente para SQLite
- el contenedor ejecuta `prisma migrate deploy` al arrancar

### Seed en Docker

Si quieres datos de ejemplo en el contenedor:

```bash
docker compose exec nutri-week npm run prisma:seed
```

## Reverse proxy opcional

Puedes colocar la app detras de Nginx o Caddy apuntando al puerto `3000`.

Ejemplo rapido con Nginx:

```nginx
server {
  listen 80;
  server_name nutri-week.local;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## PM2 o systemd

PM2:

```bash
npm run build
pm2 start npm --name nutri-week -- run start
```

systemd:

- define `WorkingDirectory` en la raiz del proyecto
- usa `ExecStart=/usr/bin/npm run start`
- exporta `DATABASE_URL`

## Estructura

```text
app/
  api/
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
  migrations/
  schema.prisma
  seed.ts
scripts/
tests/
```

## Decisiones tecnicas principales

- dominio correcto mantenido: receta base por serving, porciones reales en `PlannedMealPortion`
- planner y duplicado de semana protegidos con transacciones
- borrado de recetas seguro en servidor
- checklist persistente separada del agregado, pero ligada relacionalmente a la semana
- reset deliberado del checklist al cambiar el planner para evitar estados corruptos
- normalizacion simple y explicita para shopping list
- backup y restore basados en copia real de SQLite, sin servicios externos

## Testing

Se incluyen tests para:

- agregacion de shopping list
- normalizacion y formato
- helpers del planner
- duplicado seguro
- higiene de datos de recetas
- bloqueo de borrado de recetas en uso
- resumen nutricional

Ejecucion:

```bash
npm run test
```

## Troubleshooting

### `prisma migrate dev` falla en Windows sandbox

En algunos entornos restringidos de Windows el motor de Prisma puede devolver `EPERM`.

Opciones:

- ejecutar el comando fuera del sandbox o terminal restringida
- usar Docker
- aplicar primero la migracion existente y luego lanzar `npm run prisma:seed`

### La app arranca pero no guarda datos

Comprueba:

- que `DATABASE_URL` apunta a una ruta escribible
- que el proceso tiene permisos de escritura sobre la carpeta de la base
- que en Docker el volumen esta montado correctamente

### El checklist no coincide tras cambiar el planner

Es intencional: al cambiar comidas o porciones de una semana, el estado del checklist de esa semana se reinicia para mantener integridad.

## Limitaciones conocidas

- la normalizacion de ingredientes no intenta resolver equivalencias complejas
- no hay importador completo desde la UI
- la exportacion completa de datos se hace por script

## Roadmap fase 2

- importacion segura de datos exportados
- soporte para mas personas
- objetivos de macros por persona
- historial avanzado de semanas
- exportacion imprimible del planner
