/* ============================================================
   VERVE — Sanity Studio (the content dashboard)

   How to use (owner notes):
   - Run locally:   cd studio && npm install && npm run dev
                    → http://localhost:3333
   - Put online:    npm run deploy   (once; then open
                    https://<name>.sanity.studio from any browser)
   - Add a project: Projects → "+" (top of the list) → fill
                    Basics, Images and Project page → Publish.
                    Only PUBLISHED projects appear on the site,
                    usually within a minute (CDN cache).
   - Order:         "Position on the site" — lower first. The four
                    original projects are 0, 10, 20, 30.
   - Settings come from studio/.env (copy .env.example):
                    SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET.
                    The same project id goes in
                    assets/js/cms-config.js for the website.
   - One-off import of the four built-in projects:
                    SANITY_WRITE_TOKEN=… npm run seed
                    (npm run seed:dry previews it offline).
   ============================================================ */
import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes/index.js'
import {structure} from './structure.js'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'set-your-project-id'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineConfig({
  name: 'default',
  title: 'Verve — Portfolio',
  projectId,
  dataset,
  plugins: [
    structureTool({structure}),
    visionTool({defaultApiVersion: '2025-02-19'}), // GROQ playground, for testing queries
  ],
  schema: {
    types: schemaTypes,
    // Only "Project" can be created from the "+" menu
    templates: (prev) => prev.filter((t) => t.schemaType === 'project'),
  },
  document: {
    newDocumentOptions: (prev, {creationContext}) =>
      creationContext.type === 'global' ? prev.filter((t) => t.templateId === 'project') : prev,
  },
})
