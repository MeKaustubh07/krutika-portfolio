/* ============================================================
   VERVE v2 — hero layer manifest ("living illustration").
   Generated from the cover artwork by $SP/tools/hero/export.py.
   All coordinates are art px of the cropped illustration (w × h).
   Stack (back→front): sky · clouds
     · backTrees · scene · rustle · house · facade (night) · people.
   clouds:    depth 0..1 (parallax), speed art px/s (drift right, wrap).
   backTrees: rotate around pivot (px,py) by ±amp deg over period s;
              they sit BEHIND scene (scene has holes where they were).
   movers:    path = absolute top-left positions (path[0] = x,y = rest).
              face = native facing ("left"|"right"|"none"); flip=true means
              the sprite faces left, so mirror it while it moves right
              (face "right": mirror while moving left; "none": never).
              bob = vertical step bob in art px.
   rustle:    foreground trees left in scene (in front of the grey house);
              RGBA cut of their leaves (alpha = soft leaf mask) for a
              subtle shimmer / micro-sway overlay at the same x,y.
   house:     the house cut from scene (tower, white box, section, stair,
              boundary wall + gate) — kept at its daylight look at night.
   facade:    night-only warm light in the LEFT facade openings (white box +
              red tower) — precomputed RGBA, alpha = openings only; the
              cross-section interiors never glow. dusk.windowGlow = the
              opening rects (a couple flicker softly).
   ground / groundRight / lane: walkable surface polylines.
   stickers:  the other people cut out of scene (idle sway about feet px,py).
   skies:     morning / noon / night sky plates (same grain, tinted).
   ============================================================ */
(function () {
  "use strict";
  window.HERO_LAYERS = {
   "w": 1561,
   "h": 1081,
   "fallback": "assets/img/hero/cover.webp",
   "sky": {"src": "assets/img/hero/sky.webp"},
   "clouds": [
    {"src": "assets/img/hero/clouds/cloud-1.webp", "x": 776, "y": 0, "w": 223, "h": 74, "depth": 0.25, "speed": 3.0, "front": false},
    {"src": "assets/img/hero/clouds/cloud-2.webp", "x": 1178, "y": 0, "w": 259, "h": 45, "depth": 0.2, "speed": 2.4, "front": false},
    {"src": "assets/img/hero/clouds/cloud-3.webp", "x": 38, "y": 52, "w": 199, "h": 55, "depth": 0.55, "speed": 5.5, "front": true},
    {"src": "assets/img/hero/clouds/cloud-4.webp", "x": 357, "y": 62, "w": 225, "h": 55, "depth": 0.5, "speed": 4.6, "front": true},
    {"src": "assets/img/hero/clouds/cloud-5.webp", "x": 1195, "y": 108, "w": 200, "h": 57, "depth": 0.65, "speed": 6.2, "front": true},
    {"src": "assets/img/hero/clouds/cloud-6.webp", "x": 340, "y": 225, "w": 143, "h": 51, "depth": 0.8, "speed": 7.5, "front": false}
   ],
   "backTrees": [
    {"id": "tree-left", "src": "assets/img/hero/trees/tree-1.webp", "x": 0, "y": 143, "w": 334, "h": 400, "px": 150, "py": 528, "amp": 0.9, "period": 9.0},
    {"id": "tree-house", "src": "assets/img/hero/trees/tree-2.webp", "x": 540, "y": 95, "w": 496, "h": 453, "px": 770, "py": 560, "amp": 0.55, "period": 11.0},
    {"id": "tree-topright", "src": "assets/img/hero/trees/tree-3.webp", "x": 1389, "y": 0, "w": 172, "h": 315, "px": 1556, "py": 300, "amp": 1.0, "period": 8.0},
    {"id": "tree-palm", "src": "assets/img/hero/trees/tree-4.webp", "x": 1414, "y": 363, "w": 147, "h": 176, "px": 1488, "py": 600, "amp": 0.8, "period": 7.0}
   ],
   "scene": {"src": "assets/img/hero/scene.webp"},
   "movers": [
    {"id": "umbrella", "src": "assets/img/hero/movers/umbrella.webp", "x": 581, "y": 675, "w": 52, "h": 114, "path": [[581, 675], [553, 669]], "duration": 15, "mode": "pingpong", "face": "left", "flip": true, "bob": 0.8, "z": "front"},
    {"id": "mother", "src": "assets/img/hero/movers/mother.webp", "x": 343, "y": 777, "w": 92, "h": 124, "path": [[343, 777], [373, 774]], "duration": 18, "mode": "pingpong", "face": "right", "flip": false, "bob": 0.7, "z": "front"},
    {"id": "dhoti", "src": "assets/img/hero/movers/dhoti.webp", "x": 15, "y": 769, "w": 37, "h": 109, "path": [[15, 769], [49, 766]], "duration": 17, "mode": "pingpong", "face": "none", "flip": false, "bob": 0.6, "z": "front"},
    {"id": "cyclist", "src": "assets/img/hero/movers/cyclist.webp", "x": 1501, "y": 682, "w": 53, "h": 113, "path": [[1501, 682], [1471, 686]], "duration": 16, "mode": "pingpong", "face": "none", "flip": false, "bob": 0.6, "z": "front"}
   ],
   "rustle": [
    {"id": "rustle-flowertree", "src": "assets/img/hero/rustle/flowertree.webp", "x": 318, "y": 445, "w": 321, "h": 262},
    {"id": "rustle-lefttree", "src": "assets/img/hero/rustle/lefttree.webp", "x": 0, "y": 539, "w": 142, "h": 231},
    {"id": "rustle-palm", "src": "assets/img/hero/rustle/palm.webp", "x": 112, "y": 606, "w": 230, "h": 196},
    {"id": "rustle-banana", "src": "assets/img/hero/rustle/banana.webp", "x": 380, "y": 722, "w": 134, "h": 118}
   ],
   "house": {"src": "assets/img/hero/house.webp", "x": 652, "y": 189, "w": 779, "h": 674},
   "facade": {"src": "assets/img/hero/facade-glow.webp", "x": 722, "y": 383, "w": 215, "h": 374},
   "dusk": {
    "windowGlow": [
     {"x": 722, "y": 383, "w": 19, "h": 34},
     {"x": 768, "y": 402, "w": 30, "h": 33},
     {"x": 806, "y": 386, "w": 11, "h": 18},
     {"x": 723, "y": 451, "w": 46, "h": 50},
     {"x": 788, "y": 454, "w": 19, "h": 17},
     {"x": 788, "y": 489, "w": 19, "h": 71},
     {"x": 750, "y": 520, "w": 18, "h": 33},
     {"x": 722, "y": 534, "w": 10, "h": 18},
     {"x": 920, "y": 441, "w": 15, "h": 32},
     {"x": 894, "y": 485, "w": 30, "h": 21},
     {"x": 894, "y": 522, "w": 13, "h": 49},
     {"x": 884, "y": 578, "w": 36, "h": 38},
     {"x": 902, "y": 630, "w": 28, "h": 30},
     {"x": 874, "y": 646, "w": 17, "h": 34},
     {"x": 912, "y": 677, "w": 14, "h": 17},
     {"x": 874, "y": 697, "w": 27, "h": 19},
     {"x": 916, "y": 712, "w": 14, "h": 43},
     {"x": 743, "y": 686, "w": 49, "h": 37},
     {"x": 865, "y": 438, "w": 19, "h": 102}
    ]
   },
   "sun": {"x": 1110, "y": 105, "r": 34},
   "ground": [[0, 950], [200, 932], [400, 911], [600, 891], [720, 878], [745, 868], [900, 853]],
   "groundRight": [[1440, 804], [1561, 792]],
   "lane": [[480, 760], [652, 798]],
   "stickers": [
    {"id": "sari", "src": "assets/img/hero/stickers/sari.webp", "x": 785, "y": 737, "w": 43, "h": 124, "px": 806, "py": 858, "amp": 1.6, "period": 6.5},
    {"id": "stair", "src": "assets/img/hero/stickers/stair.webp", "x": 1367, "y": 573, "w": 41, "h": 106, "px": 1390, "py": 676, "amp": 1.1, "period": 7.5},
    {"id": "girl", "src": "assets/img/hero/stickers/girl.webp", "x": 1104, "y": 722, "w": 31, "h": 69, "px": 1120, "py": 788, "amp": 1.3, "period": 5.5}
   ],
   "skies": {"morning": "assets/img/hero/sky-morning.webp", "noon": "assets/img/hero/sky.webp", "night": "assets/img/hero/sky-night.webp"}
  };
})();
