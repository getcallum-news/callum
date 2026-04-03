"use client";

import { useEffect, useRef, useState } from "react";

// ── Shader sources ──────────────────────────────────────────────
const VERT_PARTICLES = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_alpha;
  uniform vec2 u_resolution;
  varying float v_alpha;
  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    clip.y *= -1.0;
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = a_size;
    v_alpha = a_alpha;
  }
`;

const FRAG_PARTICLES = `
  precision mediump float;
  varying float v_alpha;
  uniform vec3 u_color;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.3, d) * v_alpha;
    gl_FragColor = vec4(u_color, a);
  }
`;

const VERT_LINES = `
  attribute vec2 a_position;
  attribute float a_alpha;
  uniform vec2 u_resolution;
  varying float v_alpha;
  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    clip.y *= -1.0;
    gl_Position = vec4(clip, 0.0, 1.0);
    v_alpha = a_alpha;
  }
`;

const FRAG_LINES = `
  precision mediump float;
  varying float v_alpha;
  uniform vec3 u_color;
  void main() {
    gl_FragColor = vec4(u_color, v_alpha * 0.15);
  }
`;

// ── Helpers ──────────────────────────────────────────────────────
function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const v = createShader(gl, gl.VERTEX_SHADER, vs);
  const f = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram()!;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// ── Spatial grid for fast neighbor lookup ────────────────────────
const GRID_CELL = 120; // px — same as connection distance

function buildGrid(
  px: Float32Array,
  py: Float32Array,
  count: number,
  w: number,
  h: number
) {
  const cols = Math.ceil(w / GRID_CELL) || 1;
  const rows = Math.ceil(h / GRID_CELL) || 1;
  const cells: number[][] = new Array(cols * rows);
  for (let i = 0; i < cells.length; i++) cells[i] = [];
  for (let i = 0; i < count; i++) {
    const cx = Math.min(Math.floor(px[i] / GRID_CELL), cols - 1);
    const cy = Math.min(Math.floor(py[i] / GRID_CELL), rows - 1);
    if (cx >= 0 && cy >= 0) cells[cy * cols + cx].push(i);
  }
  return { cells, cols, rows };
}

// ── Component ───────────────────────────────────────────────────
const PARTICLE_COUNT_DESKTOP = 1800;
const PARTICLE_COUNT_MOBILE = 600;
const CONNECTION_DIST = 120;
const MOUSE_RADIUS = 200;
const MOUSE_FORCE = 0.8;
const BASE_SPEED = 0.15;

export default function ParticleFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [hidden, setHidden] = useState(false);

  // Hide in light mode — ShaderBackground takes over
  useEffect(() => {
    const check = () => setHidden(!document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

    // Reduced motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) return;

    // ── Programs ──
    const particleProg = createProgram(gl, VERT_PARTICLES, FRAG_PARTICLES);
    const lineProg = createProgram(gl, VERT_LINES, FRAG_LINES);
    if (!particleProg || !lineProg) return;

    // ── Particle state (CPU) ──
    const px = new Float32Array(COUNT);
    const py = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);
    const baseAlphas = new Float32Array(COUNT);

    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    function initParticles() {
      for (let i = 0; i < COUNT; i++) {
        px[i] = Math.random() * w;
        py[i] = Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const speed = BASE_SPEED + Math.random() * 0.2;
        vx[i] = Math.cos(angle) * speed;
        vy[i] = Math.sin(angle) * speed;
        sizes[i] = 1.5 + Math.random() * 2.5;
        baseAlphas[i] = 0.15 + Math.random() * 0.5;
        alphas[i] = baseAlphas[i];
      }
    }

    resize();
    initParticles();
    window.addEventListener("resize", () => {
      resize();
    });

    // ── Mouse ──
    let mx = -9999;
    let my = -9999;
    const onMouse = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const onLeave = () => {
      mx = -9999;
      my = -9999;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    // ── GPU buffers ──
    const particleBuf = gl.createBuffer()!;
    const lineBuf = gl.createBuffer()!;

    // Interleaved: [x, y, size, alpha] per particle
    const particleData = new Float32Array(COUNT * 4);
    // Lines: [x1, y1, a1, x2, y2, a2] — max connections
    const MAX_LINES = COUNT * 3;
    const lineData = new Float32Array(MAX_LINES * 6);

    // ── Particle program locations ──
    gl.useProgram(particleProg);
    const pPosLoc = gl.getAttribLocation(particleProg, "a_position");
    const pSizeLoc = gl.getAttribLocation(particleProg, "a_size");
    const pAlphaLoc = gl.getAttribLocation(particleProg, "a_alpha");
    const pResLoc = gl.getUniformLocation(particleProg, "u_resolution");
    const pColorLoc = gl.getUniformLocation(particleProg, "u_color");

    // ── Line program locations ──
    gl.useProgram(lineProg);
    const lPosLoc = gl.getAttribLocation(lineProg, "a_position");
    const lAlphaLoc = gl.getAttribLocation(lineProg, "a_alpha");
    const lResLoc = gl.getUniformLocation(lineProg, "u_resolution");
    const lColorLoc = gl.getUniformLocation(lineProg, "u_color");

    // ── Theme detection ──
    let isDark = document.documentElement.classList.contains("dark");
    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // ── Animation loop ──
    const dpr = Math.min(window.devicePixelRatio, 2);

    function frame() {
      // Update particles
      for (let i = 0; i < COUNT; i++) {
        // Mouse repulsion
        const dx = px[i] - mx;
        const dy = py[i] - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force =
            (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
          vx[i] += (dx / dist) * force;
          vy[i] += (dy / dist) * force;
          // Brighten near mouse
          alphas[i] = Math.min(1, baseAlphas[i] + (1 - dist / MOUSE_RADIUS) * 0.5);
        } else {
          alphas[i] += (baseAlphas[i] - alphas[i]) * 0.02;
        }

        // Damping
        vx[i] *= 0.98;
        vy[i] *= 0.98;

        // Drift force (keep particles moving)
        vx[i] += (Math.random() - 0.5) * 0.02;
        vy[i] += (Math.random() - 0.5) * 0.02;

        // Clamp speed
        const speed = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        if (speed > 1.5) {
          vx[i] = (vx[i] / speed) * 1.5;
          vy[i] = (vy[i] / speed) * 1.5;
        }

        px[i] += vx[i];
        py[i] += vy[i];

        // Wrap around edges
        if (px[i] < -10) px[i] = w + 10;
        if (px[i] > w + 10) px[i] = -10;
        if (py[i] < -10) py[i] = h + 10;
        if (py[i] > h + 10) py[i] = -10;
      }

      // Build interleaved particle data
      for (let i = 0; i < COUNT; i++) {
        const o = i * 4;
        particleData[o] = px[i] * dpr;
        particleData[o + 1] = py[i] * dpr;
        particleData[o + 2] = sizes[i] * dpr;
        particleData[o + 3] = alphas[i];
      }

      // Build connections using spatial grid
      const grid = buildGrid(px, py, COUNT, w, h);
      let lineCount = 0;
      const connDist2 = CONNECTION_DIST * CONNECTION_DIST;

      for (let i = 0; i < COUNT && lineCount < MAX_LINES; i++) {
        const cx = Math.min(Math.floor(px[i] / GRID_CELL), grid.cols - 1);
        const cy = Math.min(Math.floor(py[i] / GRID_CELL), grid.rows - 1);
        if (cx < 0 || cy < 0) continue;

        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1 && lineCount < MAX_LINES; dy++) {
          for (let dx = -1; dx <= 1 && lineCount < MAX_LINES; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= grid.cols || ny < 0 || ny >= grid.rows)
              continue;
            const cell = grid.cells[ny * grid.cols + nx];
            for (let k = 0; k < cell.length && lineCount < MAX_LINES; k++) {
              const j = cell[k];
              if (j <= i) continue;
              const ddx = px[i] - px[j];
              const ddy = py[i] - py[j];
              const d2 = ddx * ddx + ddy * ddy;
              if (d2 < connDist2) {
                const a = 1 - Math.sqrt(d2) / CONNECTION_DIST;
                const o = lineCount * 6;
                lineData[o] = px[i] * dpr;
                lineData[o + 1] = py[i] * dpr;
                lineData[o + 2] = a;
                lineData[o + 3] = px[j] * dpr;
                lineData[o + 4] = py[j] * dpr;
                lineData[o + 5] = a;
                lineCount++;
              }
            }
          }
        }
      }

      // ── Render ──
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.enable(gl!.BLEND);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);

      const resW = w * dpr;
      const resH = h * dpr;
      const color: [number, number, number] = isDark
        ? [0.72, 0.78, 1.0] // soft blue-white
        : [0.45, 0.38, 0.28]; // warm brown

      // Draw lines
      if (lineCount > 0) {
        gl!.useProgram(lineProg);
        gl!.uniform2f(lResLoc, resW, resH);
        gl!.uniform3f(lColorLoc, color[0], color[1], color[2]);

        gl!.bindBuffer(gl!.ARRAY_BUFFER, lineBuf);
        gl!.bufferData(
          gl!.ARRAY_BUFFER,
          lineData.subarray(0, lineCount * 6),
          gl!.DYNAMIC_DRAW
        );

        gl!.enableVertexAttribArray(lPosLoc);
        gl!.vertexAttribPointer(lPosLoc, 2, gl!.FLOAT, false, 12, 0);
        gl!.enableVertexAttribArray(lAlphaLoc);
        gl!.vertexAttribPointer(lAlphaLoc, 1, gl!.FLOAT, false, 12, 8);

        gl!.drawArrays(gl!.LINES, 0, lineCount * 2);
      }

      // Draw particles
      gl!.useProgram(particleProg);
      gl!.uniform2f(pResLoc, resW, resH);
      gl!.uniform3f(pColorLoc, color[0], color[1], color[2]);

      gl!.bindBuffer(gl!.ARRAY_BUFFER, particleBuf);
      gl!.bufferData(gl!.ARRAY_BUFFER, particleData, gl!.DYNAMIC_DRAW);

      gl!.enableVertexAttribArray(pPosLoc);
      gl!.vertexAttribPointer(pPosLoc, 2, gl!.FLOAT, false, 16, 0);
      gl!.enableVertexAttribArray(pSizeLoc);
      gl!.vertexAttribPointer(pSizeLoc, 1, gl!.FLOAT, false, 16, 8);
      gl!.enableVertexAttribArray(pAlphaLoc);
      gl!.vertexAttribPointer(pAlphaLoc, 1, gl!.FLOAT, false, 16, 12);

      gl!.drawArrays(gl!.POINTS, 0, COUNT);

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseleave", onLeave);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: hidden ? 0 : 0.6,
        transition: "opacity 0.6s ease",
        visibility: hidden ? "hidden" as const : "visible" as const,
      }}
    />
  );
}
