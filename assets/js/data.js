/* ============================================================
   VERVE v2 — content model, transcribed from the 2026 folio
   and The Fortress project sheet.
   Block types: text | feature | grid | tabs | seq | strip |
                compare | legend
   ============================================================ */

var PROJECTS = [
  {
    id: "mitra",
    no: "01",
    name: "Mitra Residence",
    practice: "Aakar Group of Consultancy",
    place: "Sangli, Maharashtra",
    year: "2025",
    typology: "Private residence · Wada typology",
    role: "Illustration, plans, sections, exploded axonometric",
    cover: "mitra-sectional-perspective",
    banner: "mitra-front-elevation",   /* project-page header: landscape, shown uncropped */
    tile: "mitra-front-elevation", tileZoom: 1.3, tilePos: "25% 13%",   /* home tile: crop the sheet border + title strip */
    thumbs: ["mitra-front-elevation", "mitra-plan-ground", "mitra-massing-6"],
    accent: "#7b82b8",
    lede: "A traditional Wada house drawn around its courtyard — the heart of everyday life.",
    intro: [
      "The illustrations were developed to communicate the essence of a traditional Wada house, where the central courtyard forms the heart of everyday life. The exploded axonometric view was designed to reveal the spatial hierarchy and interconnected movement around the courtyard, illustrating how each space is visually and physically linked."
    ],
    blocks: [
      { type: "feature", label: "Sectional perspective",
        item: { src: "mitra-sectional-perspective", title: "Sectional Perspective", note: "Day &amp; night through the courtyard", portrait: true } },
      { type: "text", kicker: "Graphic language", title: "One drawing set, one voice",
        body: ["Plans, sections, elevations, and sectional perspectives were carefully composed using a consistent graphic language, subtle textures, contextual elements, and atmospheric lighting to enhance readability while preserving the architectural character."] },
      { type: "feature", label: "Elevation",
        item: { src: "mitra-front-elevation", title: "Front Elevation", note: "Street approach" } },
      { type: "tabs", label: "Plan set", items: [
        { src: "mitra-plan-ground",  title: "Ground Floor Plan",  tab: "Ground",  note: "Verandah · courtyard · library · kitchen" },
        { src: "mitra-plan-first",   title: "First Floor Plan",   tab: "First",   note: "Bedrooms · balcony · family lounge" },
        { src: "mitra-plan-terrace", title: "Terrace Floor Plan", tab: "Terrace", note: "Terrace over the courtyard void" }
      ]},
      { type: "grid", label: "Sections", cols: 1, items: [
        { src: "mitra-section-aa", title: "Section AA&prime;", note: "Library, courtyard &amp; bedroom" },
        { src: "mitra-section-bb", title: "Section BB&prime;", note: "Verandah, living, courtyard &amp; dining" }
      ]},
      { type: "text", kicker: "Form derivation", title: "From mass to courtyard house",
        body: ["The illustrations aim to document not only the built form but also the cultural narrative, materiality, and lived experience embedded within the design."] },
      { type: "seq", label: "Form derivation", items: [
        { src: "mitra-massing-1", title: "Primary Mass Formation",
          note: "The rectangular mass is articulated to mark the probable built-up area and site enclosure." },
        { src: "mitra-massing-2", title: "Mass Articulation",
          note: "The primary mass is cut and stepped to break monotony and respond to access points, defining entry zones and movement orientation." },
        { src: "mitra-massing-3", title: "Courtyard",
          note: "A central void is carved out of the mass to introduce a courtyard, referencing traditional Wada architecture — allowing light, ventilation and visual connectivity within the built form." },
        { src: "mitra-massing-4", title: "Volume",
          note: "The built mass is modulated to generate varying internal volumes responding to a sloping roof profile, articulated into two distinct masses that establish a clear vertical hierarchy." },
        { src: "mitra-massing-5", title: "Preliminary Envelope",
          note: "Probable openings and sloping roof configurations are introduced, testing light, ventilation and scale. The overall form is derived from the roof geometry, which begins to shape the volumes below." },
        { src: "mitra-massing-6", title: "Final Form",
          note: "The final form integrates massing, courtyard, verandah and roof into a cohesive whole — balancing solid and void, tradition and function, while responding to site and climate." }
      ]}
    ]
  },

  {
    id: "tulip",
    no: "02",
    name: "Royal Tulip Housing",
    practice: "Collage Architecture Studio",
    place: "Bengaluru, Karnataka",
    year: "2025",
    typology: "Villa township · 29-amenity masterplan",
    role: "Masterplan graphics, sectional perspectives, unit &amp; clubhouse documentation",
    cover: "tulip-sectional-perspective",
    banner: "tulip-sectional-perspective",   /* project-page header: landscape, shown uncropped */
    tile: "tulip-sectional-perspective",   /* home tile: one 1.41:1 illustration per project */
    thumbs: ["tulip-site-plan", "tulip-unit-elevation", "tulip-clubhouse-exploded"],
    accent: "#d8792b",
    lede: "Two villa typologies, east and west facing, drawn as a study in orientation and light.",
    intro: [
      "This series of illustrations was developed to explore the contrasting spatial experiences of the east- and west-facing villas at Royal Tulip Housing. Through sectional perspectives, plans, and architectural sections, the drawings communicate how orientation influences daylight, privacy, and the relationship between interior spaces and outdoor courts."
    ],
    blocks: [
      { type: "feature", label: "Sectional perspective",
        item: { src: "tulip-sectional-perspective", title: "East &amp; West Facing Villas", note: "Paired sectional perspective through the shared court" } },
      { type: "text", kicker: "Colour as orientation", title: "Morning and evening, side by side",
        body: ["A bold complementary colour palette was intentionally introduced to distinguish the two villa typologies, creating a clear visual contrast while reinforcing the narrative of changing light conditions throughout the day. Strong graphic compositions, expressive shadows, and simplified textures were used to establish hierarchy and enhance legibility without compromising architectural precision."] },
      { type: "feature", label: "Masterplan",
        item: { src: "tulip-site-plan", title: "Site Plan", note: "29 amenities across the layout", portrait: true } },
      { type: "tabs", label: "Villa unit — plan set", items: [
        { src: "tulip-villa-plan-ground", title: "Ground Floor Plan", tab: "Ground", note: "Plot 7.1 × 13.4 m · parking · entry" },
        { src: "tulip-villa-plan-first",  title: "First Floor Plan",  tab: "First",  note: "Living · bedroom · kitchen / dining · landscape" },
        { src: "tulip-villa-plan-second", title: "Second Floor Plan", tab: "Second", note: "Master bedroom · dresser · study · bedroom 2" }
      ]},
      { type: "strip", label: "West facing unit", items: [
        { src: "tulip-section-aa",     title: "Section AA&prime;", note: "Through parking, court and stair" },
        { src: "tulip-section-bb",     title: "Section BB&prime;", note: "Through living, terrace and street" },
        { src: "tulip-unit-elevation", title: "Unit Elevation",   note: "Four-unit street frontage" }
      ]},
      { type: "text", kicker: "Clubhouse", title: "Drawings as narrative",
        body: ["The illustrations balance technical documentation with graphic storytelling, transforming conventional architectural drawings into engaging visual narratives that clearly communicate design intent, spatial organization, and the lived experience of each housing typology."] },
      { type: "feature", label: "Clubhouse",
        item: { src: "tulip-clubhouse-exploded", title: "Exploded Diagram — Clubhouse", note: "Programme stacked across three plates", portrait: true } },
      { type: "grid", label: "Clubhouse drawings", cols: 2, items: [
        { src: "tulip-clubhouse-plan-ground", title: "Ground Floor Plan", note: "Badminton · pools · banquet" },
        { src: "tulip-clubhouse-plan-first",  title: "First Floor Plan",  note: "Gym · guest rooms · indoor games" },
        { src: "tulip-clubhouse-section-1",   title: "Section 01", note: "Water court, pool, play areas &amp; gym" },
        { src: "tulip-clubhouse-section-2",   title: "Section 02", note: "Entrance, water court &amp; badminton court" }
      ]}
    ]
  },

  {
    id: "anthill",
    no: "03",
    name: "Anthill",
    practice: "Kaushal Tatiya Architects",
    place: "Pune, Maharashtra",
    year: "2025",
    typology: "Residence · exposed brick",
    role: "Illustration, documentation, construction details",
    cover: "anthill-sectional-perspective",
    banner: "anthill-context-axo",   /* project-page header: landscape, shown uncropped */
    tile: "anthill-context-axo", tileZoom: 1.06, tilePos: "50% 50%",   /* crop the drawn border */
    thumbs: ["anthill-elevation", "anthill-context-axo", "anthill-brick-detail"],
    accent: "#b4593a",
    lede: "Exposed brick drawn as craft — arches, jali walls and courses, course by course.",
    intro: [
      "Anthill presented an opportunity to explore architectural illustration as a medium for expressing materiality, craftsmanship, and spatial experience. The visual language was developed around the project's exposed brick architecture, where every drawing celebrates the honesty of construction and the richness of handcrafted details."
    ],
    blocks: [
      { type: "feature", label: "Sectional perspective",
        item: { src: "anthill-sectional-perspective", title: "Sectional Perspective", note: "House and landscape read as one section", portrait: true } },
      { type: "text", kicker: "Palette", title: "Terracotta, earth and muted green",
        body: ["A restrained palette of terracotta, warm earth tones, and muted greens was carefully curated to complement the natural character of brick, creating a timeless and cohesive visual identity throughout the project. Soft textures, atmospheric backgrounds, and delicate linework were employed to enhance depth while ensuring the architecture remained the focal point of every composition."] },
      { type: "feature", label: "Context",
        item: { src: "anthill-context-axo", title: "Contextual Axonometric", note: "The brick volume set against its street" } },
      { type: "tabs", label: "Plan set", items: [
        { src: "anthill-plan-ground", title: "Ground Floor Plan", tab: "Ground", note: "Entry · courtyard · pooja · water cascade" },
        { src: "anthill-plan-first",  title: "First Floor Plan",  tab: "First",  note: "Lobby · guest bedroom · terrace" },
        { src: "anthill-plan-second", title: "Second Floor Plan", tab: "Second", note: "Master bedroom · family lounge · pool" }
      ]},
      { type: "compare", label: "Elevation ↔ section",
        a: { src: "anthill-elevation", title: "Front Elevation" },
        b: { src: "anthill-section", title: "Long Section" },
        caption: "Drag to cut from the brick skin into the house." },
      { type: "text", kicker: "Interconnected narratives", title: "From layout to the craft of building",
        body: ["The sectional perspective, plans, elevations, contextual axonometric, and construction details were illustrated as interconnected narratives rather than isolated technical drawings. Each illustration reveals a different layer of the project — from spatial organization and the relationship between architecture and landscape to the craftsmanship of brick arches, jali walls, and structural details. Together, they communicate not only how the building is designed, but how it is experienced and ultimately constructed."] },
      { type: "grid", label: "Construction details", cols: 2, items: [
        { src: "anthill-brick-detail", title: "Brick Arch Detail", note: "Front elevation · brick course · section AA&Prime;" },
        { src: "anthill-jali-detail",  title: "Jali Wall Detail",  note: "Elevation · section · plan · 37 courses" }
      ]},
      { type: "text", kicker: "Closing", title: "One of my most meaningful works",
        body: ["This project remains one of my most meaningful works as an architectural illustrator. It reflects my passion for transforming architectural documentation into immersive visual stories that celebrate design, materiality, and the craft of building."] }
    ]
  },

  {
    id: "fortress",
    no: "04",
    name: "The Fortress",
    practice: "Aakar Group of Consultancy",
    place: "Jaisingpur, Maharashtra",
    year: "2026",
    typology: "Residence · board-formed concrete",
    role: "Visualization — renders, axonometric, plan &amp; section",
    cover: "fortress-hero",
    banner: "fortress-hero",   /* project-page header: landscape, shown uncropped */
    tile: "fortress-axo",
    thumbs: ["fortress-axo", "fortress-section", "fortress-interior-kitchen"],
    accent: "#8a8f96",
    lede: "A raw concrete monolith, carved open for light, landscape and life.",
    intro: [
      "Conceived as a raw concrete monolith, the residence takes on the character of a contemporary fortress. Its massive, sculpted volumes establish a strong and introverted exterior, where solid walls dominate over openings to maintain a sense of privacy and protection.",
      "The seemingly impenetrable concrete envelope is selectively carved to create deep recesses, narrow openings, terraces and internal voids."
    ],
    blocks: [
      { type: "feature", label: "Street view",
        item: { src: "fortress-hero", title: "The Fortress", note: "Jaisingpur, Maharashtra" } },
      { type: "compare", label: "Front elevation",
        a: { src: "fortress-elevation-aligned", title: "Elevation drawing" },
        b: { src: "fortress-front", title: "Render" },
        caption: "Drag between the line drawing and the rendered facade." },
      { type: "text", kicker: "Mass / void / landscape", title: "Interlocking volumes, carved voids",
        body: [
          "A contemporary residence conceived as a composition of interlocking volumes and carved voids. The architecture breaks away from a singular mass to create terraces, courtyards and landscaped pockets that bring nature into the heart of the home.",
          "The planning establishes a gradual transition from public to private, distributed vertically across multiple levels. Deep recesses, controlled openings and double-height spaces create changing relationships between light, privacy and landscape."
        ] },
      { type: "grid", label: "Axonometric", cols: 1, items: [
        { src: "fortress-axo", title: "Cutaway Axonometric", note: "Terraces, voids and the yellow spiral stair" }
      ]},
      { type: "text", kicker: "Materials", title: "A dialogue between mass and void",
        body: ["A restrained palette of stone, timber, glass and dark metal reinforces the monolithic character of the exterior while bringing warmth to the interiors. The residence becomes a dialogue between mass and void, where every subtraction creates space for light, landscape and life."] },
      { type: "strip", label: "Exterior", items: [
        { src: "fortress-garden", title: "Terrace Garden", note: "Planted recess in the concrete mass" },
        { src: "fortress-street", title: "Street Corner", note: "Slot windows and the floating plinth" },
        { src: "fortress-axo-detail", title: "Axonometric Detail", note: "Double-height living and terrace" }
      ]},
      { type: "text", kicker: "Interiors", title: "Warm, tactile, light-filled",
        body: [
          "In contrast to the fortress-like exterior, the interiors unfold as warm, tactile and light-filled spaces. The raw, monolithic character of the architecture is softened through a restrained palette of natural timber, textured stone, warm neutrals and dark accents.",
          "Large glazed openings bring the surrounding landscape into the living spaces, while carefully positioned courtyards and voids allow daylight and greenery to penetrate deep into the house. Double-height volumes create a sense of openness, balanced by intimate corners and layered seating areas. Framing the landscape pockets in between, outside the full-height windows, was part of the effortless interior concept."
        ] },
      { type: "grid", label: "Interiors", cols: 2, items: [
        { src: "fortress-interior-living", title: "Formal Living", note: "Slot window and stone wall" },
        { src: "fortress-interior-lounge", title: "Informal Living", note: "Opening onto the courtyard" }
      ]},
      { type: "feature", label: "Kitchen &amp; dining",
        item: { src: "fortress-interior-kitchen", title: "Kitchen &amp; Dining", note: "Timber, board-formed ceiling, garden light" } },
      { type: "feature", label: "Section",
        item: { src: "fortress-section", title: "Section", note: "Parking, double-height living and terraces" } },
      { type: "legend", label: "First floor plan", title: "First Floor Plan",
        src: "fortress-plan-first",
        items: ["Entrance Foyer", "Formal Living Room", "Informal Living Room", "Kitchen &amp; Dining", "Utility &amp; Storage", "Pooja",
                "Bedroom", "Walk-in Wardrobe", "Toilet", "Powder Room", "Lift", "Terrace"] }
    ]
  }
];

var HOME = {
  bio: [
    "I am a <strong>2025 Bachelor of Architecture graduate</strong> with a passion for transforming architectural ideas into compelling visual narratives. My work focuses on architectural illustration, visualization, and digital storytelling, combining technical precision with an artistic approach to communicate design intent clearly and effectively.",
    "With a strong foundation in architectural design and proficiency in industry-standard visualization tools, I enjoy creating atmospheric renders, illustrative drawings, exploded diagrams, and presentation graphics that bring architecture to life.",
    "I am continually exploring new workflows and visual techniques to produce illustrations that are both technically accurate and emotionally engaging, bridging the gap between architecture and visual communication."
  ],
  deliverables: ["Architectural illustration", "Atmospheric renders", "Sectional perspectives", "Process documentation",
                 "Plans & sections", "Masterplan graphics", "Construction details", "Presentation graphics",
                 "Visual documentation", "Post-production", "Facade animation", "Exploded axonometrics"],
  practices: [
    { name: "Aakar Group of Consultancy", place: "Sangli", ig: "the.aakar_studio", logo: "aakar-group-of-consultancy", w: 345, h: 360 },
    { name: "Kaushal Tatiya Architects", place: "Pune", ig: "kaushal_tatiya_architects", logo: "kaushal-tatiya-architects", w: 1398, h: 172 },
    { name: "Collage Architecture Studio", place: "Bengaluru", ig: "collage_architecture_studio", logo: "collage-architecture-studio", w: 389, h: 325 },
    { name: "Intraa Design Studio", place: "Pune", ig: "intraa_design_studio", logo: "intraa-design-studio", w: 508, h: 192 },
    { name: "Alok Kothari Architects", place: "Pune", ig: "alokkothariarchitects", logo: "alok-kothari-architects", w: 1873, h: 239 }
  ],
  closing: [
    "This portfolio presents a curated selection of my architectural illustration work, representing only a fraction of the projects I have undertaken. Over the past six months, I have contributed to more than 20 architectural projects, collaborating closely with multiple architectural practices to produce illustrations, presentation graphics, and visual documentation across diverse scales and typologies.",
    "Alongside my role as a full-time Architect, I continue to pursue architectural illustration as both a profession and a passion. For me, visualization extends beyond representation — it is a means of communicating design, atmosphere, and the story embedded within every project."
  ],
  email: "krutikapatange28@gmail.com",
  instagram: "verve.workbook"
};
