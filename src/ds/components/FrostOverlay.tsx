"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type FrostOverlayProps = {
  /** Freezes in from the edges when true, thaws back out when false. */
  frozen: boolean;
  /** Corner radius of the surface being frozen, as a fraction of its width. */
  radius?: number;
};

const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Ice grows inward from the rounded edge. The freezing front is pushed
// around by noise so it creeps unevenly, crystal facets come from a
// Voronoi field, and density thins toward the centre so the middle
// stays a little clearer even when fully frozen.
const FRAGMENT = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_progress;
uniform float u_time;
uniform float u_radius;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}

// Distance to the nearest Voronoi edge: 0 on a crack, larger inside a facet.
float facets(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash2(i + g);
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return d2 - d1;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 px = v_uv * u_res;
  vec2 uv = px / u_res.y;
  vec2 c = px - u_res * 0.5;

  // 0 at the edge, 1 at the centre line of the short axis.
  float sd = sdRoundBox(c, u_res * 0.5, u_radius);
  float e = clamp(-sd / (min(u_res.x, u_res.y) * 0.5), 0.0, 1.0);

  // Inward normal, so crystals can grow perpendicular to the nearest edge.
  vec2 h = vec2(1.5, 0.0);
  vec2 n = -normalize(vec2(
    sdRoundBox(c + h.xy, u_res * 0.5, u_radius) - sdRoundBox(c - h.xy, u_res * 0.5, u_radius),
    sdRoundBox(c + h.yx, u_res * 0.5, u_radius) - sdRoundBox(c - h.yx, u_res * 0.5, u_radius)) + 1e-5);
  // Wobble the growth direction so the needles fan out instead of lining up.
  float spin = (fbm(px / u_res.y * 4.0 + 9.0) - 0.5) * 2.2;
  n = vec2(n.x * cos(spin) - n.y * sin(spin), n.x * sin(spin) + n.y * cos(spin));
  vec2 t = vec2(-n.y, n.x);

  // Uneven freezing front.
  float warp = fbm(uv * 2.5 + 4.0);
  float front = u_progress * 1.3;
  float edge = e + (warp - 0.5) * 0.5;
  float frozen = smoothstep(front, front - 0.32, edge);

  // Feathers: noise stretched along the inward normal reads as needles of
  // frost reaching toward the centre.
  vec2 q = vec2(dot(uv, t), dot(uv, n));
  float feather = fbm(vec2(q.x * 22.0, q.y * 6.0) + warp * 3.0);
  feather = smoothstep(0.5, 0.85, feather) * 0.7
    + smoothstep(0.55, 0.9, fbm(vec2(q.x * 60.0, q.y * 14.0) + 5.0)) * 0.3;

  // Fine crystal facets and grain on top.
  vec2 streak = uv + vec2(warp, fbm(uv * 5.0)) * 0.3;
  float cracks = 1.0 - smoothstep(0.0, 0.035, facets(streak * 9.0));
  float grain = fbm(px * 0.45);

  float density = mix(1.0, 0.12, smoothstep(0.0, 0.85, e));
  float haze = 0.28 + grain * 0.2;
  float alpha = frozen * density * (haze + feather * 0.38 + cracks * 0.14);

  // Soft rime along the advancing front, gone once fully frozen.
  float rim = smoothstep(0.08, 0.0, abs(edge - (front - 0.1)))
    * (1.0 - smoothstep(0.7, 1.0, u_progress)) * step(0.001, u_progress);
  alpha += rim * 0.18;

  // A few glints that twinkle.
  float g = hash(floor(px / 2.0));
  float glint = step(0.9985, g) * (0.5 + 0.5 * sin(u_time * 3.0 + g * 60.0)) * frozen * density;

  vec3 cold = vec3(0.6, 0.7, 0.82);
  vec3 white = vec3(0.94, 0.97, 1.0);
  vec3 col = mix(cold, white, clamp(feather * 0.8 + cracks * 0.5 + rim, 0.0, 1.0)) + glint;
  alpha = clamp(alpha + glint * 0.7, 0.0, 0.9);

  gl_FragColor = vec4(col * alpha, alpha);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

/**
 * WebGL frost that freezes a surface from the outside in. Sits absolutely
 * over its parent. The GL context is only created the first time it
 * freezes, and the render loop idles whenever it's fully thawed.
 */
export function FrostOverlay({ frozen, radius = 0.04 }: FrostOverlayProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ progress: 0 });
  const teardown = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (frozen && !teardown.current && canvas.current) {
      teardown.current = startGL(canvas.current, state.current, radius);
    }
    if (!teardown.current) return;
    gsap.to(state.current, {
      progress: frozen ? 1 : 0,
      duration: frozen ? 2.6 : 1.2,
      ease: frozen ? "sine.inOut" : "power2.in",
      overwrite: true,
    });
  }, [frozen, radius]);

  useEffect(
    () => () => {
      teardown.current?.();
      teardown.current = null;
    },
    [],
  );

  return (
    <canvas
      data-ds="frost-overlay"
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}

/** Compiles the shader and renders on the GSAP ticker. Returns a teardown. */
function startGL(el: HTMLCanvasElement, state: { progress: number }, radius: number) {
  const gl = el.getContext("webgl", { premultipliedAlpha: true, alpha: true });
  if (!gl) return () => {};

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const u = {
    res: gl.getUniformLocation(program, "u_res"),
    progress: gl.getUniformLocation(program, "u_progress"),
    time: gl.getUniformLocation(program, "u_time"),
    radius: gl.getUniformLocation(program, "u_radius"),
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.max(1, Math.round(el.clientWidth * dpr));
    el.height = Math.max(1, Math.round(el.clientHeight * dpr));
    gl.viewport(0, 0, el.width, el.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  let cleared = false;
  const render = (time: number) => {
    const p = state.progress;
    if (p <= 0.0001) {
      // Clear once when fully thawed, then idle.
      if (!cleared) gl.clear(gl.COLOR_BUFFER_BIT);
      cleared = true;
      return;
    }
    cleared = false;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u.res, el.width, el.height);
    gl.uniform1f(u.progress, p);
    gl.uniform1f(u.time, time);
    gl.uniform1f(u.radius, el.width * radius);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  gsap.ticker.add(render);

  return () => {
    gsap.ticker.remove(render);
    ro.disconnect();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
