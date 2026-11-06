/* ============================================================
   Sidebar — a single "Projects" list, in site order.
   ============================================================ */
export const structure = (S) =>
  S.list()
    .title('Verve — Portfolio')
    .items([
      S.listItem()
        .title('Projects')
        .schemaType('project')
        .child(
          S.documentTypeList('project')
            .title('Projects — in site order')
            .defaultOrdering([{field: 'order', direction: 'asc'}]),
        ),
    ])
