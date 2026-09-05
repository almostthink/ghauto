import { EthereumMark, GamepadMark, RobloxMark, WindowsMark } from "./BrandIcons";

// The hero box, drawn as vector art rather than three CSS planes: faces here
// share exact vertices, so the edges cannot drift apart the way rotated DOM
// elements with their own border radii do.
//
// It is lit like a product render: a key light above and to the left, a cool
// bounce from the right, a violet rim along the silhouette, ambient occlusion
// where the faces meet the floor, a soft contact shadow and a short reflection.
// Every one of those is a gradient rather than a blur filter, so the whole
// illustration rasterises once and the drift stays a composited transform.

type Point = [number, number];

// The box is defined by one corner and three vectors, so every face is derived
// from the same numbers. The front face is axis aligned: skewing it as well as
// the depth made the shape read as a rhombus rather than a cube.
const SIZE = 210;
const ORIGIN: Point = [108, 96];
const RIGHT: Point = [SIZE, 0];    // along the front face, left to right
const DOWN: Point = [0, SIZE];     // along the front face, top to bottom
const DEPTH: Point = [76, -58];    // front face to back face, up and to the right

const at = (u: number, v: number, w = 0): Point => [
  ORIGIN[0] + u * RIGHT[0] + v * DOWN[0] + w * DEPTH[0],
  ORIGIN[1] + u * RIGHT[1] + v * DOWN[1] + w * DEPTH[1]
];

// A chamfered outline: every corner is cut back by `radius` and closed with a
// quadratic curve, which is what gives the box its bevel. Overlays reuse the
// same path, so a highlight can never leave a seam along an edge.
function chamfer(points: Point[], radius: number) {
  const n = points.length;
  const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const at2 = (a: Point, b: Point, distance: number): Point => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return lerp(a, b, Math.min(0.5, distance / length));
  };

  let d = "";
  for (let i = 0; i < n; i += 1) {
    const previous = points[(i - 1 + n) % n];
    const corner = points[i];
    const next = points[(i + 1) % n];
    const start = at2(corner, previous, radius);
    const end = at2(corner, next, radius);
    d += i === 0 ? `M${start[0].toFixed(1)},${start[1].toFixed(1)}` : `L${start[0].toFixed(1)},${start[1].toFixed(1)}`;
    d += `Q${corner[0].toFixed(1)},${corner[1].toFixed(1)} ${end[0].toFixed(1)},${end[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

const line = (a: Point, b: Point) => `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;

const R = 11;
const FRONT = chamfer([at(0, 0), at(1, 0), at(1, 1), at(0, 1)], R);
const TOP = chamfer([at(0, 0), at(1, 0), at(1, 0, 1), at(0, 0, 1)], R);
const SIDE = chamfer([at(1, 0), at(1, 1), at(1, 1, 1), at(1, 0, 1)], R);
const OUTLINE = chamfer([at(0, 0), at(0, 0, 1), at(1, 0, 1), at(1, 1, 1), at(1, 1), at(0, 1)], R);

const BASE_Y = at(0, 1)[1];        // where the box meets the floor
const CENTRE_X = at(0.5, 0.5)[0];

// Four tiles on the front face, in face coordinates.
const TILES: { u: number; v: number; key: string; color: string; Icon: typeof WindowsMark }[] = [
  { u: 0.3, v: 0.3, key: "windows", color: "#5aa9ff", Icon: WindowsMark },
  { u: 0.7, v: 0.3, key: "game", color: "#b98cff", Icon: GamepadMark },
  { u: 0.3, v: 0.7, key: "crypto", color: "#9d8cf5", Icon: EthereumMark },
  { u: 0.7, v: 0.7, key: "roblox", color: "#dfe6f7", Icon: RobloxMark }
];
const TILE = 0.163; // half-size of a tile in face units

export function HeroCube() {
  return (
    <svg className="hero-cube" viewBox="0 0 470 430" role="img" aria-label="Windows, game, crypto and Roblox tools">
      <defs>
        {/* Faces. Each gradient runs with the light: bright where the key hits,
            falling into shadow at the bottom and in the far corner. */}
        <linearGradient id="cubeTop" x1="0.05" y1="1" x2="0.95" y2="0">
          <stop offset="0%" stopColor="#39415f" />
          <stop offset="45%" stopColor="#2b3250" />
          <stop offset="100%" stopColor="#1c2240" />
        </linearGradient>
        <linearGradient id="cubeFront" x1="0.05" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#20273c" />
          <stop offset="50%" stopColor="#161c2d" />
          <stop offset="100%" stopColor="#0c1020" />
        </linearGradient>
        <linearGradient id="cubeSide" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#161c30" />
          <stop offset="45%" stopColor="#111728" />
          <stop offset="100%" stopColor="#231f45" />
        </linearGradient>

        {/* Ambient occlusion pooling where the front face meets the floor. */}
        <linearGradient id="frontAo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stopColor="#05070d" stopOpacity="0" />
          <stop offset="100%" stopColor="#05070d" stopOpacity="0.5" />
        </linearGradient>

        {/* Specular: a wide, soft pool where the key light reflects. */}
        <radialGradient id="frontSpec" cx="0.28" cy="0.2" r="0.75">
          <stop offset="0%" stopColor="#c8d4ff" stopOpacity="0.11" />
          <stop offset="60%" stopColor="#c8d4ff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#c8d4ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="topSpec" cx="0.3" cy="0.75" r="0.8">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Surface grain, so the faces read as matte plastic rather than flat
            fills. Rendered once into a pattern, never animated. */}
        <filter id="grainSource" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="6" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <pattern id="grain" width="140" height="140" patternUnits="userSpaceOnUse">
          <rect width="140" height="140" filter="url(#grainSource)" />
        </pattern>

        {/* Bevels: a hair of light caught on the edges that face the key. */}
        <linearGradient id="bevelKey" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cfd2ff" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#9d9fe0" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#9d9fe0" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="bevelBack" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#93a4d8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#93a4d8" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="rimLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b1ff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.12" />
        </linearGradient>

        {/* Inset tiles, lit from the same direction as the box. */}
        <linearGradient id="tileFill" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#0a0e1a" />
          <stop offset="100%" stopColor="#151b2e" />
        </linearGradient>
        <linearGradient id="tileEdge" x1="0.1" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#03050b" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.11" />
        </linearGradient>

        {/* Light in the room: a violet pool behind, a cold fill on the left. */}
        <radialGradient id="keyPool">
          <stop offset="0%" stopColor="#7c5cf0" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#5b3fd0" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#5b3fd0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coolFill">
          <stop offset="0%" stopColor="#3d6cd0" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3d6cd0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="contactShadow">
          <stop offset="0%" stopColor="#03050b" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#03050b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#03050b" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="reflectionPaint" x1="0" y1="1" x2="0.3" y2="0">
          <stop offset="0%" stopColor="#2a2f52" />
          <stop offset="100%" stopColor="#171a30" />
        </linearGradient>

        {/* The reflection is squashed, as a low camera on a matte floor sees
            it, and fades out well before the bottom of the frame. */}
        <linearGradient id="reflectionFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id="reflectionMask" maskUnits="userSpaceOnUse" x="0" y={BASE_Y} width="470" height="120">
          <rect x="0" y={BASE_Y} width="470" height="120" fill="url(#reflectionFade)" />
        </mask>

        <radialGradient id="iconGlow">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Room light, well below the box in contrast so the art sits in the
          page instead of shouting over the copy next to it. */}
      <ellipse cx="250" cy="200" rx="235" ry="200" fill="url(#keyPool)" />
      <ellipse cx="130" cy="240" rx="150" ry="150" fill="url(#coolFill)" />

      {/* Floor: the reflection first, then the shadow the box casts over it. */}
      <g mask="url(#reflectionMask)" opacity="0.6" transform={`translate(0 ${BASE_Y * 1.45 + 4}) scale(1 -0.45)`}>
        <path d={OUTLINE} fill="url(#reflectionPaint)" />
      </g>
      <ellipse cx={CENTRE_X - 4} cy={BASE_Y + 10} rx="182" ry="26" fill="url(#contactShadow)" />

      {/* Faces, drawn back to front. Overlays reuse each face's own path. */}
      <g>
        <path d={TOP} fill="url(#cubeTop)" />
        <path d={TOP} fill="url(#topSpec)" />
        <path d={TOP} fill="url(#grain)" opacity="0.13" style={{ mixBlendMode: "overlay" }} />

        <path d={SIDE} fill="url(#cubeSide)" />
        <path d={SIDE} fill="url(#grain)" opacity="0.11" style={{ mixBlendMode: "overlay" }} />

        <path d={FRONT} fill="url(#cubeFront)" />
        <path d={FRONT} fill="url(#frontSpec)" />
        <path d={FRONT} fill="url(#frontAo)" />
        <path d={FRONT} fill="url(#grain)" opacity="0.15" style={{ mixBlendMode: "overlay" }} />

        {/* Bevelled edges, stopping short of the corners so the chamfer keeps
            its curve instead of ending in a hard streak. */}
        <path d={line(at(0.04, 0), at(0.96, 0))} stroke="url(#bevelKey)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d={line(at(0, 0, 0.08), at(0, 0, 0.92))} stroke="url(#bevelKey)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d={line(at(0.06, 0, 1), at(0.94, 0, 1))} stroke="url(#bevelBack)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d={line(at(1, 0.06, 1), at(1, 0.94, 1))} stroke="url(#rimLight)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d={line(at(0.06, 0, 1), at(0.94, 0, 1))} stroke="url(#rimLight)" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" fill="none" />
        <path d={line(at(1, 0.06), at(1, 0.94))} stroke="url(#rimLight)" strokeWidth="1.3" strokeLinecap="round" fill="none" />

        {TILES.map(({ u, v, key, color, Icon }) => {
          const corners: Point[] = [
            at(u - TILE, v - TILE),
            at(u + TILE, v - TILE),
            at(u + TILE, v + TILE),
            at(u - TILE, v + TILE)
          ];
          const outline = chamfer(corners, 7);
          const [cx, cy] = at(u, v);
          return (
            <g key={key}>
              <path d={outline} fill="url(#tileFill)" />
              <path d={outline} fill="none" stroke="url(#tileEdge)" strokeWidth="1.5" />
              <g color={color}>
                <circle cx={cx} cy={cy} r="28" fill="url(#iconGlow)" />
                <g transform={`translate(${cx - 19} ${cy - 19})`}>
                  <Icon size={38} />
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
