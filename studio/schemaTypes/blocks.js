/* ============================================================
   Page blocks — the sections of a project page, top to bottom.
   The _type names are fixed: the site reads them by name
   (textBlock → text, featureBlock → feature, gridBlock → grid,
   tabsBlock → tabs, stepsBlock → seq, stripBlock → strip,
   compareBlock → compare, legendBlock → legend).
   ============================================================ */
import {defineArrayMember, defineField, defineType} from 'sanity'

/* ---------- shared fields ---------- */
const label = (description) =>
  defineField({
    name: 'label',
    title: 'Section label',
    description: description || 'Small heading above the section, e.g. "Plan set" or "Sections".',
    type: 'string',
  })

const oneDrawing = (name, title, description) =>
  defineField({
    name,
    title,
    description,
    type: 'drawing',
    validation: (rule) => rule.required().error('Please add the drawing.'),
  })

const drawings = (description, min = 1, max) =>
  defineField({
    name: 'drawings',
    title: 'Drawings',
    description,
    type: 'array',
    of: [defineArrayMember({type: 'drawing'})],
    validation: (rule) => {
      let r = rule.required().min(min).error(`Add at least ${min} drawing${min > 1 ? 's' : ''}.`)
      if (max) r = r.max(max)
      return r
    },
  })

/* preview: "<Kind> — <label>" with the first drawing as thumbnail */
const preview = (kind, media = 'drawings.0.image') => ({
  select: {label: 'label', title: 'title', media},
  prepare: ({label: l, title, media: m}) => ({
    title: kind,
    subtitle: l || title || '',
    media: m,
  }),
})

/* ---------- block types ---------- */
export const textBlock = defineType({
  name: 'textBlock',
  title: 'Text',
  type: 'object',
  description: 'A short written passage between drawings.',
  fields: [
    defineField({
      name: 'kicker',
      title: 'Small label',
      description: 'Tiny line above the heading, e.g. "Graphic language".',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Heading',
      description: 'e.g. "One drawing set, one voice".',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Paragraphs',
      description: 'Add one item per paragraph.',
      type: 'array',
      of: [defineArrayMember({type: 'text', rows: 5})],
      validation: (rule) => rule.required().min(1).error('Write at least one paragraph.'),
    }),
  ],
  preview: {
    select: {kicker: 'kicker', title: 'title'},
    prepare: ({kicker, title}) => ({title: 'Text', subtitle: [kicker, title].filter(Boolean).join(' — ')}),
  },
})

export const featureBlock = defineType({
  name: 'featureBlock',
  title: 'Feature drawing (one large drawing)',
  type: 'object',
  fields: [label('Small heading, e.g. "Sectional perspective".'), oneDrawing('drawing', 'Drawing')],
  preview: preview('Feature drawing', 'drawing.image'),
})

export const gridBlock = defineType({
  name: 'gridBlock',
  title: 'Grid of drawings',
  type: 'object',
  fields: [
    label('Small heading, e.g. "Sections" or "Construction details".'),
    defineField({
      name: 'cols',
      title: 'Drawings per row',
      description: '1 = full width, one under another. 2 or 3 = side by side.',
      type: 'number',
      options: {list: [1, 2, 3], layout: 'radio', direction: 'horizontal'},
      initialValue: 2,
      validation: (rule) =>
        rule.required().integer().min(1).max(3).error('Choose 1, 2 or 3 drawings per row.'),
    }),
    drawings('The drawings in the grid.'),
  ],
  preview: preview('Grid'),
})

export const tabsBlock = defineType({
  name: 'tabsBlock',
  title: 'Tabs (e.g. floor plans)',
  type: 'object',
  description: 'Visitors switch between drawings with tab buttons — ideal for a plan set.',
  fields: [
    label('Small heading, e.g. "Plan set".'),
    defineField({
      ...drawings('Give every drawing a "Tab name" (e.g. Ground, First, Terrace).', 2),
      validation: (rule) => [
        rule.required().min(2).error('Add at least 2 drawings.'),
        rule
          .custom((list) => (!list || list.every((d) => d && d.tab) ? true : 'Every drawing needs a "Tab name".'))
          .warning(),
      ],
    }),
  ],
  preview: preview('Tabs'),
})

export const stepsBlock = defineType({
  name: 'stepsBlock',
  title: 'Step-through (e.g. form derivation)',
  type: 'object',
  description: 'Visitors step through drawings one by one; each drawing\'s "Short note" is the step text.',
  fields: [label('Small heading, e.g. "Form derivation".'), drawings('In order, first step first.', 2)],
  preview: preview('Step-through'),
})

export const stripBlock = defineType({
  name: 'stripBlock',
  title: 'Horizontal strip',
  type: 'object',
  description: 'A row of drawings that scrolls sideways.',
  fields: [label('Small heading, e.g. "Exterior".'), drawings('Two or more drawings.', 2)],
  preview: preview('Strip'),
})

export const compareBlock = defineType({
  name: 'compareBlock',
  title: 'Before / after slider',
  type: 'object',
  description: 'Two drawings of the same view; visitors drag a slider between them.',
  fields: [
    label('Small heading, e.g. "Front elevation".'),
    oneDrawing('a', 'Left drawing', 'e.g. the line drawing. Both drawings should be the same size.'),
    oneDrawing('b', 'Right drawing', 'e.g. the render.'),
    defineField({
      name: 'caption',
      title: 'Caption',
      description: 'e.g. "Drag between the line drawing and the rendered facade."',
      type: 'string',
    }),
  ],
  preview: preview('Before / after', 'a.image'),
})

export const legendBlock = defineType({
  name: 'legendBlock',
  title: 'Plan with numbered legend',
  type: 'object',
  description: 'One plan with a numbered list of rooms beside it.',
  fields: [
    label('Small heading, e.g. "First floor plan".'),
    defineField({name: 'title', title: 'Title', description: 'e.g. "First Floor Plan".', type: 'string'}),
    oneDrawing('drawing', 'Plan drawing'),
    defineField({
      name: 'items',
      title: 'Legend (rooms)',
      description: 'One room per line, in the order of the numbers on the plan.',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: preview('Plan + legend', 'drawing.image'),
})

export const blockTypes = [
  textBlock,
  featureBlock,
  gridBlock,
  tabsBlock,
  stepsBlock,
  stripBlock,
  compareBlock,
  legendBlock,
]
