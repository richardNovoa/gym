#!/usr/bin/env node
/**
 * One-off seed for the shared exercise catalog.
 *
 * Reads https://github.com/wrkout/exercises.json (not run by the app).
 * Inserts rows with owner_id null and source_id = the dataset directory id.
 * Images stay as raw GitHub URLs. Requires the service-role key because RLS
 * only lets a signed-in user insert exercises they own.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run seed:exercises
 *   node scripts/seed-exercises.mjs --dry-run
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const TREE_URL = 'https://api.github.com/repos/wrkout/exercises.json/git/trees/master?recursive=1'
const RAW_ROOT = 'https://raw.githubusercontent.com/wrkout/exercises.json/master'
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

loadEnvFile(resolve(process.cwd(), '.env'))

const dryRun = process.argv.includes('--dry-run')

try {
  const rows = await buildRows()
  console.log(`Prepared ${rows.length} exercises from wrkout/exercises.json.`)
  if (rows.length === 0) {
    console.error('The dataset returned no exercises.')
    process.exit(1)
  }
  if (dryRun) {
    console.log(JSON.stringify(rows.slice(0, 2), null, 2))
    console.log('Dry run only. Nothing was written.')
    process.exit(0)
  }
  await upsert(rows)
  console.log('Catalog seed finished.')
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value
  }
}

async function buildRows() {
  const tree = await fetchTree()
  const imagesById = new Map()
  const ids = []
  for (const node of tree) {
    if (node.type !== 'blob' || typeof node.path !== 'string') continue
    const exercise = node.path.match(/^exercises\/([^/]+)\/exercise\.json$/)
    if (exercise) {
      ids.push({ id: exercise[1], path: node.path })
      continue
    }
    const image = node.path.match(/^exercises\/([^/]+)\/images\/([^/]+)$/)
    if (!image) continue
    const ext = image[2].slice(image[2].lastIndexOf('.')).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    const list = imagesById.get(image[1]) ?? []
    list.push(image[2])
    imagesById.set(image[1], list)
  }

  const records = await mapPool(ids, 12, async (entry) => {
    const response = await fetch(rawUrl(entry.path), {
      headers: { 'User-Agent': 'gym-seed', Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`Failed to read ${entry.path} (${response.status}).`)
    }
    const json = await response.json()
    const files = (imagesById.get(entry.id) ?? []).slice().sort()
    return toRow(entry.id, json, files.map((file) => rawUrl(`exercises/${entry.id}/images/${file}`)))
  })
  return records.filter(Boolean)
}

function toRow(id, json, images) {
  const name = typeof json.name === 'string' ? json.name.trim() : ''
  if (!name) return null
  return {
    owner_id: null,
    source_id: id,
    name,
    force: emptyToNull(json.force),
    level: emptyToNull(json.level),
    mechanic: emptyToNull(json.mechanic),
    equipment: emptyToNull(json.equipment),
    category: emptyToNull(json.category),
    primary_muscles: asStrings(json.primaryMuscles),
    secondary_muscles: asStrings(json.secondaryMuscles),
    instructions: asStrings(json.instructions),
    images,
  }
}

async function upsert(rows) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) {
    throw new Error('Set SUPABASE_URL (or VITE_SUPABASE_URL).')
  }
  if (!key) {
    throw new Error(
      'Set SUPABASE_SERVICE_ROLE_KEY. The publishable key cannot insert shared catalog rows (owner_id null) because of row level security. Find the service role key in the Supabase dashboard under Project Settings → API. Do not commit it or prefix it with VITE_.',
    )
  }
  if (key.startsWith('sb_publishable_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is a publishable key. Use the service role key.')
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const size = 150
  for (let index = 0; index < rows.length; index += size) {
    const chunk = rows.slice(index, index + size)
    const { error } = await supabase.from('exercises').upsert(chunk, { onConflict: 'source_id' })
    if (error) throw new Error(error.message)
    console.log(`Upserted ${Math.min(index + chunk.length, rows.length)} / ${rows.length}`)
  }
}

async function fetchTree() {
  const headers = {
    'User-Agent': 'gym-seed',
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(TREE_URL, { headers })
  if (!response.ok) {
    throw new Error(`GitHub tree request failed (${response.status}).`)
  }
  const body = await response.json()
  if (body.truncated) {
    throw new Error('GitHub truncated the exercise tree. Re-run with a GITHUB_TOKEN or a sparse checkout.')
  }
  if (!Array.isArray(body.tree)) throw new Error('Unexpected GitHub tree response.')
  return body.tree
}

function rawUrl(path) {
  const encoded = path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
  return `${RAW_ROOT}/${encoded}`
}

function emptyToNull(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asStrings(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index], index)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}
