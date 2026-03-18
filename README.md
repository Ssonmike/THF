# TheHomeFood (THF)

Planificación nutricional semanal personal para dos personas. Minimalista, rápida, auto-hospedada.

---

## Qué hace

- **Biblioteca de recetas** — CRUD completo, búsqueda, filtros por tipo de comida, favoritos, duplicar
- **Planner semanal** — Lunes a Domingo, 4 slots por día (Desayuno/Comida/Cena/Merienda), porciones independientes por persona
- **Lista de compra** — generada automáticamente desde el planner, normalización y agrupación de ingredientes, checklist persistente
- **Dashboard** — resumen del día actual, accesos rápidos
- **Regla fundamental** — la receta define ingredientes por 1 ración estándar; el planner define cuántas raciones toma cada persona

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript strict |
| Base de datos | SQLite vía Prisma 5 |
| Validación | Zod |
| Estilos | CSS Modules (sin frameworks CSS) |
| Tests | Vitest |
| Docker | Alpine, non-root, volumen persistente |

---

## Inicio rápido (desarrollo local)

```bash
# 1. Clonar e instalar
git clone <repo> thf && cd thf
npm install

# 2. Configurar entorno
cp .env.example .env
# DATABASE_URL ya está configurado para SQLite local

# 3. Crear base de datos y datos iniciales
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Arrancar en desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Comandos disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Compilar para producción
npm run start            # Servidor de producción

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Aplicar migraciones (dev)
npm run db:migrate:deploy # Aplicar migraciones (producción)
npm run db:seed          # Crear datos iniciales (Miguel, Ana + recetas de ejemplo)
npm run db:reset         # Borrar y recrear la BD desde cero + seed
npm run db:studio        # Interfaz visual Prisma Studio

# Tests
npm test                 # Ejecutar todos los tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura

# Backup
npm run backup           # Backup de la BD -> ./backups/
node scripts/restore.js <archivo>  # Restaurar desde backup

# Todo en uno (instalación desde cero)
npm run setup
```

---

## Producción local (sin Docker)

```bash
# 1. Configurar .env para producción
echo 'DATABASE_URL="file:./data/prod.db"' > .env

# 2. Crear directorio de datos
mkdir -p data

# 3. Build + migraciones + seed
npm run build
npm run db:migrate:deploy
npm run db:seed

# 4. Arrancar
npm start
```

---

## Docker (recomendado para self-hosting)

```bash
# Arrancar con Docker Compose
docker compose up -d

# La BD persiste en ./data/prod.db en tu host
# Acceso: http://localhost:3000

# Ver logs
docker compose logs -f thf

# Parar
docker compose down

# Actualizar (rebuild)
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Volumen SQLite

La base de datos se guarda en `./data/prod.db` en el directorio donde está el `docker-compose.yml`. Nunca se pierde aunque el contenedor se destruya.

---

## Backup y restauración

### Backup manual

```bash
npm run backup
# Crea: ./backups/thf-backup-YYYY-MM-DDTHH-MM-SS.db
```

### Restaurar desde backup

```bash
# Para la app antes de restaurar
node scripts/restore.js ./backups/thf-backup-2026-03-18T10-00-00.db
# Pide confirmación y guarda un backup de seguridad automáticamente
```

### Con Docker

```bash
# Backup (desde fuera del contenedor)
cp ./data/prod.db ./backups/thf-backup-$(date +%Y-%m-%dT%H-%M-%S).db

# Restore (con la app parada)
docker compose down
cp ./backups/thf-backup-XXX.db ./data/prod.db
docker compose up -d
```

### Automatización (cron)

```bash
# Backup diario a las 3:00 AM
0 3 * * * cd /ruta/a/thf && npm run backup >> /var/log/thf-backup.log 2>&1
```

---

## Ubicación de la base de datos

| Entorno | Ubicación |
|---------|-----------|
| Desarrollo | `prisma/dev.db` |
| Producción local | `data/prod.db` |
| Docker | `./data/prod.db` (mapeado como volumen) |

---

## Modelo de datos (reglas de dominio)

1. `Recipe` define ingredientes por **1 ración estándar**
2. `PlannedMeal` asigna una receta a un (día, slot) del plan semanal
3. `PlannedMealPortion` guarda las raciones de **cada persona** para esa comida concreta
4. La lista de compra = suma de `(ingrediente.cantidad x raciones_totales_de_ambas_personas)` por semana
5. La nutrición = `nutrición_por_ración x raciones_persona`
6. Las porciones de Miguel y Ana **no viven en la receta** — viven en la planificación concreta

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              # Dashboard (hoy)
│   ├── recipes/              # Lista, detalle, nueva, editar
│   ├── planner/              # Planner semanal
│   ├── shopping/             # Lista de compra
│   └── api/health/           # Health check
├── actions/                  # Server actions (recipes, planner, shopping)
├── components/               # Nav, RecipeForm
├── lib/
│   ├── prisma.ts             # Cliente Prisma singleton
│   ├── dates.ts              # Utilidades de fechas (UTC, semanas)
│   ├── shopping.ts           # Agregación lista de compra
│   └── validations.ts        # Schemas Zod
├── test/                     # Tests Vitest
└── types/                    # Tipos TypeScript compartidos
prisma/
├── schema.prisma             # Modelo de datos
├── migrations/               # Migraciones SQL
└── seed.ts                   # Datos iniciales
scripts/
├── backup.js                 # Script de backup
└── restore.js                # Script de restauración
```

---

## Troubleshooting

### La app no arranca — error de base de datos

```bash
# Verificar que la migración se ha aplicado
npm run db:generate
npm run db:migrate:deploy
```

### Error "SQLITE_READONLY" en Docker

El volumen `./data/` debe tener permisos de escritura para el usuario del contenedor (UID 1001).

```bash
sudo chown -R 1001:1001 ./data/
```

### Quiero resetear los datos completamente

```bash
npm run db:reset
# O con Docker:
docker compose down
rm ./data/prod.db
docker compose up -d  # El entrypoint recrea y hace seed
```

### Prisma Studio no ve los datos de producción

```bash
DATABASE_URL="file:./data/prod.db" npm run db:studio
```

---

## Personas

Por defecto se crean Miguel y Ana al hacer seed. Para añadir más personas usa Prisma Studio o SQL directo en la BD.

---

## Tests

```bash
npm test              # 64 tests — shopping, fechas, validaciones
npm run test:coverage  # Con cobertura HTML en ./coverage/
```
