#!/bin/sh
set -e

echo "🏠 TheHomeFood starting..."

# Run database migrations
echo "⏳ Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed if database is empty (check persons table)
PERSON_COUNT=$(npx prisma --version > /dev/null 2>&1 && node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.person.count().then(n => { console.log(n); p.\$disconnect(); }).catch(() => { console.log(0); });
" 2>/dev/null || echo "0")

if [ "$PERSON_COUNT" = "0" ]; then
  echo "🌱 Seeding initial data..."
  node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.person.upsert({ where: { slug: 'miguel' }, update: {}, create: { name: 'Miguel', slug: 'miguel' } }),
  p.person.upsert({ where: { slug: 'ana' }, update: {}, create: { name: 'Ana', slug: 'ana' } }),
]).then(() => { console.log('✓ Persons created'); p.\$disconnect(); });
" 2>/dev/null || echo "⚠ Seed skipped"
fi

echo "✅ Starting Next.js..."
exec node server.js
