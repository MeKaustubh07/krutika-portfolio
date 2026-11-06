/* ============================================================
   project — one work project (a home-page card + its own page).
   Field names match window.PROJECTS in assets/js/data.js.
   ============================================================ */
import {defineArrayMember, defineField, defineType} from 'sanity'
import {blockTypes} from './blocks.js'

const HEX = /^#[0-9a-fA-F]{6}$/

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Basics', default: true},
    {name: 'images', title: 'Images'},
    {name: 'page', title: 'Project page'},
  ],
  fields: [
    /* ---------- basics ---------- */
    defineField({
      name: 'title',
      title: 'Project name',
      description: 'e.g. "Mitra Residence".',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.required().max(80).error('Please give the project a name.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      description:
        'The project page link (project.html?p=…). Click "Generate" to make it from the name. Do not change it after publishing.',
      type: 'slug',
      group: 'basics',
      options: {
        source: 'title',
        maxLength: 48,
        /* the site only reads lowercase letters, numbers and dashes (see assets/js/cms.js) */
        slugify: (input) =>
          String(input || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, ''),
      },
      validation: (rule) => [
        rule.required().error('Click "Generate" to create the web address.'),
        rule.custom((v) =>
          !v || !v.current || /^[a-z0-9][a-z0-9-]{0,47}$/.test(v.current) ||
          'Use lowercase letters, numbers and dashes only (e.g. "villa-no-5"), or the project will not show on the site.'),
      ],
    }),
    defineField({
      name: 'order',
      title: 'Position on the site',
      description:
        'Lower numbers come first. The four original projects use 0, 10, 20, 30 — use 40, 50 … to add after them, or 5 to slot one in between.',
      type: 'number',
      group: 'basics',
      initialValue: 100,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'practice',
      title: 'Practice / client',
      description: 'The office you drew it for, e.g. "Aakar Group of Consultancy".',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'place',
      title: 'Location',
      description: 'e.g. "Sangli, Maharashtra".',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      description: 'e.g. "2026".',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.regex(/^\d{4}(\s*[–-]\s*\d{2,4})?$/, {name: 'year'}).warning('Usually a year like 2026.'),
    }),
    defineField({
      name: 'typology',
      title: 'Building type',
      description: 'e.g. "Private residence · Wada typology".',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'role',
      title: 'My role',
      description: 'What you did, e.g. "Illustration, plans, sections".',
      type: 'string',
      group: 'basics',
    }),
    defineField({
      name: 'accent',
      title: 'Accent colour',
      description: 'A colour picked from the drawings, as a hex code like #7b82b8. Tints the project page.',
      type: 'string',
      group: 'basics',
      initialValue: '#8a8f96',
      validation: (rule) =>
        rule.required().custom((v) => (!v || HEX.test(v) ? true : 'Use a 6-digit hex code like #7b82b8.')),
    }),
    defineField({
      name: 'lede',
      title: 'One-line summary',
      description: 'Shown on the card and at the top of the project page. Keep it to one sentence.',
      type: 'text',
      rows: 2,
      group: 'basics',
      validation: (rule) => rule.max(220).warning('Shorter reads better — one sentence.'),
    }),
    defineField({
      name: 'intro',
      title: 'Introduction',
      description: 'Opening paragraphs on the project page. Add one item per paragraph.',
      type: 'array',
      group: 'basics',
      of: [defineArrayMember({type: 'text', rows: 5})],
    }),

    /* ---------- images ---------- */
    defineField({
      name: 'cover',
      title: 'Cover image — shown on the home page card',
      description: 'The main drawing for this project. Also used in the menu and drawings strip.',
      type: 'image',
      group: 'images',
      options: {hotspot: true},
      validation: (rule) => rule.required().error('A cover image is needed for the home page card.'),
    }),
    defineField({
      name: 'banner',
      title: 'Banner — wide drawing shown at the top of the project page',
      description: 'A landscape (wide) drawing, shown uncropped. Leave empty to use the cover image.',
      type: 'image',
      group: 'images',
      options: {hotspot: true},
    }),
    defineField({
      name: 'thumbs',
      title: 'Small previews on the card',
      description: 'Up to 3 extra drawings shown small on the home page card.',
      type: 'array',
      group: 'images',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
      options: {layout: 'grid'},
      validation: (rule) => rule.max(3).error('Up to 3 previews.'),
    }),

    /* ---------- page ---------- */
    defineField({
      name: 'blocks',
      title: 'Page sections',
      description:
        'Build the project page from top to bottom. Click "Add item" and pick a section type; drag to reorder.',
      type: 'array',
      group: 'page',
      of: blockTypes.map((b) => defineArrayMember({type: b.name})),
    }),
  ],
  orderings: [
    {title: 'Position on the site', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Year, newest first', name: 'yearDesc', by: [{field: 'year', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', practice: 'practice', place: 'place', year: 'year', media: 'cover'},
    prepare: ({title, practice, place, year, media}) => ({
      title: title || 'Untitled project',
      subtitle: [practice, place, year].filter(Boolean).join(' · '),
      media,
    }),
  },
})
