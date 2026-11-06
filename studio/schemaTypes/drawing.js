/* ============================================================
   drawing — one illustration with its caption. Reused by every
   block that shows drawings.
   ============================================================ */
import {defineField, defineType} from 'sanity'

export const drawing = defineType({
  name: 'drawing',
  title: 'Drawing',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Drawing',
      description: 'Upload the drawing (JPG or PNG). It is never cropped on the site.',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required().error('Please upload the drawing.'),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Shown under the drawing, e.g. "Ground Floor Plan".',
      type: 'string',
    }),
    defineField({
      name: 'note',
      title: 'Short note',
      description:
        'One line under the title, e.g. "Verandah · courtyard · kitchen". In a step-through block this is the step text.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'tab',
      title: 'Tab name',
      description: 'Only used inside a "Tabs" block — the short word on the tab button, e.g. "Ground".',
      type: 'string',
    }),
    defineField({
      name: 'portrait',
      title: 'Tall drawing',
      description: 'Turn on if the drawing is taller than it is wide, so the layout gives it room.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'title', tab: 'tab', note: 'note', media: 'image'},
    prepare: ({title, tab, note, media}) => ({
      title: title || 'Untitled drawing',
      subtitle: [tab && `Tab: ${tab}`, note].filter(Boolean).join(' — '),
      media,
    }),
  },
})
