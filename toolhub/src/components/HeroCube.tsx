import { EthereumMark, GamepadMark, RobloxMark, WindowsMark } from "./BrandIcons";

// The hero box, drawn as vector art rather than three CSS planes: faces here
// share exact vertices, so the edges cannot drift apart the way rotated DOM
// elements with their own border radii do. Rounded corners come from stroking
// each face with its own fill and a round line join.

type Point = [number, number];

// The box is defined by one corner and three vectors, so every face is derived
// from the same numbers. The front face is axis aligned: skewing it as well as
// the depth made the shape read as a rhombus rather than a cube.
const SIZE = 236;
const ORIGIN: Point = [92, 116];
const RIGHT: Point = [SIZE, 0];    // along the front face, left to right
const DOWN: Point = [0, SIZE];     // along the front face, top to bottom
const DEPTH: Point = [86, -66];    // front face to back face, up and to the right

const at = (u: number, v: number, w = 0): Point => [
  ORIGIN[0] + u * RIGHT[0] + v * DOWN[0] + w * DEPTH[0],
  ORIGIN[1] + u * RIGHT[1] + v * DOWN[1] + w * DEPTH[1]
];

const poly = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const FRONT = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
const TOP = [at(0, 0), at(1, 0), at(1, 0, 1), at(0, 0, 1)];
const SIDE = [at(1, 0), at(1, 1), at(1, 1, 1), at(1, 0, 1)];

// Four tiles on the front face, in face coordinates.
const TILES: { u: number; v: number; key: string; color: string; Icon: typeof WindowsMark }[] = [
  { u: 0.3, v: 0.29, key: "windows", color: "#4da3ff", Icon: WindowsMark },
  { u: 0.7, v: 0.29, key: "game", color: "#c084fc", Icon: GamepadMark },
  { u: 0.3, v: 0.71, key: "crypto", color: "#a78bfa", Icon: EthereumMark },
  { u: 0.7, v: 0.71, key: "roblox", color: "#f1f5ff", Icon: RobloxMark }
];
const TILE = 0.17; // half-size of a tile in face units

export function HeroCube() {
  return (
    <svg className="hero-cube" viewBox="0 0 470 430" role="img" aria-label="Windows, game, crypto and Roblox tools">
      <defs>
        <linearGradient id="cubeFront" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#1c2942" />
          <stop offset="55%" stopColor="#111a2c" />
          <stop offset="100%" stopColor="#0a1020" />
        </linearGradient>
        <linearGradient id="cubeTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a4a78" />
          <stop offset="100%" stopColor="#1b2540" />
        </linearGradient>
        <linearGradient id="cubeSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a2440" />
          <stop offset="100%" stopColor="#0a0f1c" />
        </linearGradient>
        <linearGradient id="tileFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16203a" />
          <stop offset="100%" stopColor="#0c1424" />
        </linearGradient>
        <radialGradient id="cubeGlow">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="iconGlow">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Light pooling behind and under the box. */}
      <ellipse cx="245" cy="200" rx="230" ry="200" fill="url(#cubeGlow)" />
      <ellipse cx="210" cy="374" rx="145" ry="26" fill="url(#cubeGlow)" opacity="0.7" />

      {/* Perspective floor, drawn from the same vanishing direction. */}
      <g stroke="#8b5cf6" strokeOpacity="0.22" strokeWidth="1">
        {[0, 1, 2, 3].map((i) => (
          <line key={`h${i}`} x1={30 - i * 10} y1={318 + i * 28} x2={440 + i * 10} y2={286 + i * 28} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={70 + i * 72} y1={312} x2={30 + i * 88} y2={424} />
        ))}
      </g>

      {/* Faces, drawn back to front. The stroke rounds each corner. */}
      <polygon points={poly(TOP)} fill="url(#cubeTop)" stroke="url(#cubeTop)" strokeWidth="16" strokeLinejoin="round" />
      <polygon points={poly(SIDE)} fill="url(#cubeSide)" stroke="url(#cubeSide)" strokeWidth="16" strokeLinejoin="round" />
      <polygon points={poly(FRONT)} fill="url(#cubeFront)" stroke="url(#cubeFront)" strokeWidth="16" strokeLinejoin="round" />

      {/* Edge catching the light, along the top of the front face. */}
      <polyline
        points={poly([at(0, 0), at(1, 0)])}
        fill="none"
        stroke="#a78bfa"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polyline
        points={poly([at(1, 0), at(1, 1)])}
        fill="none"
        stroke="#8b5cf6"
        strokeOpacity="0.32"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {TILES.map(({ u, v, key, color, Icon }) => {
        const corners: Point[] = [
          at(u - TILE, v - TILE),
          at(u + TILE, v - TILE),
          at(u + TILE, v + TILE),
          at(u - TILE, v + TILE)
        ];
        const [cx, cy] = at(u, v);
        return (
          <g key={key}>
            <polygon
              points={poly(corners)}
              fill="url(#tileFill)"
              stroke="#ffffff"
              strokeOpacity="0.09"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <g color={color}>
              <circle cx={cx} cy={cy} r="34" fill="url(#iconGlow)" />
              <g transform={`translate(${cx - 21} ${cy - 21})`}>
                <Icon size={42} />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
