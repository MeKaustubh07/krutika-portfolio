/* ============================================================
   seed.mjs — one-off import of the built-in projects
   (assets/js/data.js) into Sanity.

   node scripts/seed.mjs --dry   print the documents, no network
   node scripts/seed.mjs         upload images + createOrReplace

   Env (studio/.env or shell): SANITY_STUDIO_PROJECT_ID,
   SANITY_STUDIO_DATASET (default production), SANITY_WRITE_TOKEN.
   Idempotent: document _id = project-<slug>; image assets are
   deduped by Sanity (same file → same asset) and in-run.
   ============================================================ */
import {createReadStream, existsSync, readFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import vm from 'node:vm'

const HERE = dirname(fileURLToPath(import.meta.url))
const STUDIO = resolve(HERE, '..')
const SITE = resolve(STUDIO, '..')
const DATA_JS = join(SITE, 'assets/js/data.js')
const IMG_DIR = join(SITE, 'assets/img/full')
const DRY = process.argv.includes('--dry')

/* ---------- env ---------- */
const envFile = join(STUDIO, '.env')
if (existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile)
const env = process.env
const projectId = env.SANITY_STUDIO_PROJECT_ID
const dataset = env.SANITY_STUDIO_DATASET || 'production'
const token = env.SANITY_WRITE_TOKEN

/* ---------- load data.js in a sandbox ---------- */
function loadProjects() {
  const sandbox = {window: {}}
  vm.createContext(sandbox)
  vm.runInContext(readFileSync(DATA_JS, 'utf8') + '\n;window.PROJECTS = PROJECTS;', sandbox, {
    filename: DATA_JS,
    timeout: 2000,
  })
  const list = sandbox.window.PROJECTS
  if (!Array.isArray(list) || !list.length) throw new Error('No PROJECTS found in ' + DATA_JS)
  return list
}

/* ---------- text: data.js holds HTML entities; Sanity stores plain text ---------- */
const NAMED = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  prime: '′', Prime: '″', middot: '·', ndash: '–', mdash: '—',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', times: '×', harr: '↔'}
function plain(s) {
  if (s == null) return undefined
  return String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1))
      return NAMED[e] ?? m
    })
    .trim()
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''))

/* ---------- images ---------- */
const assetIds = new Map() // slug -> asset _id (dedupe within the run)
const missing = new Set()
let client = null

async function imageRef(slug) {
  if (!slug) return undefined
  const file = join(IMG_DIR, slug + '.jpg')
  if (!existsSync(file)) missing.add(slug)
  if (!assetIds.has(slug)) {
    if (DRY) {
      assetIds.set(slug, `image-(dry:${slug}.jpg)`)
    } else {
      if (!existsSync(file)) throw new Error('Image not found: ' + file)
      const asset = await client.assets.upload('image', createReadStream(file), {filename: slug + '.jpg'})
      assetIds.set(slug, asset._id)
      console.log('  uploaded', slug + '.jpg', '→', asset._id)
    }
  }
  return {_type: 'image', asset: {_type: 'reference', _ref: assetIds.get(slug)}}
}

let keyN = 0
const key = () => 'k' + (++keyN).toString(36).padStart(5, '0')

async function drawing(it, withKey) {
  if (!it || !it.src) return undefined
  return clean({
    ...(withKey ? {_key: key()} : {}),
    _type: 'drawing',
    image: await imageRef(it.src),
    title: plain(it.title),
    note: plain(it.note),
    tab: plain(it.tab),
    portrait: it.portrait ? true : undefined,
  })
}
const drawingList = async (items) => Promise.all((items || []).map((it) => drawing(it, true)))
const texts = (arr) => (arr || []).map(plain).filter(Boolean)

const KIND = {text: 'textBlock', feature: 'featureBlock', grid: 'gridBlock', tabs: 'tabsBlock',
  seq: 'stepsBlock', strip: 'stripBlock', compare: 'compareBlock', legend: 'legendBlock'}

async function block(b) {
  const _type = KIND[b.type]
  if (!_type) { console.warn('  ! skipped unknown block type', b.type); return undefined }
  const base = {_key: key(), _type, label: plain(b.label)}
  switch (b.type) {
    case 'text': return clean({...base, kicker: plain(b.kicker), title: plain(b.title), body: texts(b.body)})
    case 'feature': return clean({...base, drawing: await drawing(b.item)})
    case 'grid': return clean({...base, cols: Math.min(3, Math.max(1, b.cols || 2)), drawings: await drawingList(b.items)})
    case 'compare': return clean({...base, a: await drawing(b.a), b: await drawing(b.b), caption: plain(b.caption)})
    case 'legend': return clean({...base, title: plain(b.title), drawing: await drawing({src: b.src, title: b.title}), items: texts(b.items)})
    default: return clean({...base, drawings: await drawingList(b.items)}) // tabs, seq, strip
  }
}

async function toDoc(p, i) {
  const thumbs = []
  for (const t of p.thumbs || []) thumbs.push({_key: key(), ...(await imageRef(t))})
  const blocks = []
  for (const b of p.blocks || []) { const d = await block(b); if (d) blocks.push(d) }
  return clean({
    _id: 'project-' + p.id,
    _type: 'project',
    title: plain(p.name),
    slug: {_type: 'slug', current: p.id},
    order: i * 10,
    practice: plain(p.practice),
    place: plain(p.place),
    year: plain(p.year),
    typology: plain(p.typology),
    role: plain(p.role),
    accent: /^#[0-9a-fA-F]{6}$/.test(p.accent || '') ? p.accent : undefined,
    lede: plain(p.lede),
    intro: texts(p.intro),
    cover: await imageRef(p.cover),
    banner: p.banner ? await imageRef(p.banner) : undefined,
    thumbs: thumbs.slice(0, 3),
    blocks,
  })
}

/* ---------- main ---------- */
async function main() {
  const projects = loadProjects()
  if (!DRY) {
    if (!projectId || !token) {
      console.error('Missing SANITY_STUDIO_PROJECT_ID or SANITY_WRITE_TOKEN (studio/.env). Use --dry to preview.')
      process.exit(1)
    }
    const {createClient} = await import('@sanity/client')
    client = createClient({projectId, dataset, token, apiVersion: '2025-02-19', useCdn: false})
    console.log(`Seeding ${projects.length} projects into ${projectId}/${dataset} …`)
  }

  const docs = []
  for (const [i, p] of projects.entries()) {
    keyN = 0
    const doc = await toDoc(p, i)
    docs.push(doc)
    const count = JSON.stringify(doc).match(/"_ref"/g)?.length || 0
    console.log(`• ${doc._id}  "${doc.title}"  order ${doc.order}  ${doc.blocks.length} blocks  ${count} image refs`)
  }

  if (DRY) {
    console.log('\n' + JSON.stringify(docs, null, 2))
    console.log(`\nDry run: ${docs.length} documents, ${assetIds.size} unique images.`)
    if (missing.size) console.log('MISSING image files:', [...missing].join(', '))
    else console.log('All referenced image files exist in assets/img/full/.')
    return
  }

  const tx = client.transaction()
  docs.forEach((d) => tx.createOrReplace(d))
  await tx.commit({visibility: 'sync'})
  console.log(`Done: ${docs.length} projects published, ${assetIds.size} images.`)
}

main().catch((err) => {
  console.error('Seed failed:', err.message || err)
  process.exit(1)
})
