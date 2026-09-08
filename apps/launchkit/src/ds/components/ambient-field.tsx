'use client';

import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '../lib/cn';

/**
 * AmbientField (foundations/atmosphere.md)
 *
 * The pad before liftoff, drawn live: a sky, a horizon glow in flare, and
 * three luminous wave lines that swell slowly across the frame, each with
 * a translucent fill beneath it. A small WebGL fragment shader painted
 * from the `--field-*` tokens, so it is dawn in light and night in dark.
 * The only thing that moves is the waves. No grain flicker, no dot grid.
 *
 * Renders at reduced resolution at 30fps, pauses off-screen and in hidden
 * tabs, holds a still frame under reduced motion, and falls back to a
 * gradient when WebGL is unavailable. Allowed behind front doors only.
 */
const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';

const FRAG = `
precision highp float;
uniform vec2 u_res;uniform float u_time;uniform vec2 u_pointer;uniform float u_dark;uniform float u_k;
uniform vec3 u_sky0;uniform vec3 u_sky1;uniform vec3 u_glow;uniform vec3 u_r0;uniform vec3 u_r1;uniform vec3 u_r2;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.1,9.7);a*=0.5;}return v;}
/* a wave: a long swell, a shorter counter-swell, and a slow organic ripple */
float wave(float x,float t,float base,float amp,float freq,float speed,float seed){
  float s=sin(x*freq+t*speed+seed)*0.62+sin(x*freq*2.3-t*speed*1.35+seed*1.7)*0.24;
  float n=fbm(vec2(x*freq*0.8+seed,t*speed*0.3+seed))-0.5;
  return base+amp*(s+n*0.8);
}
/* a luminous line: a thin core and a soft halo, in frame units */
float line(float d,float core,float halo){return exp(-d*d/(2.0*core*core))*0.9+exp(-d/halo)*0.3;}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float aspect=u_res.x/u_res.y;
  float x=uv.x*aspect;
  float t=u_time;
  vec2 pp=(u_pointer-0.5)*0.012;
  vec3 col=mix(u_sky1,u_sky0,smoothstep(0.3,1.0,uv.y));
  float horizon=0.44+pp.y;
  float gx=exp(-pow((uv.x-0.66-pp.x)/0.46,2.0));
  float gy=exp(-pow((uv.y-horizon)/0.17,2.0));
  col=mix(col,u_glow,gx*gy*(0.3+0.28*u_dark)*u_k);
  float px=1.0/u_res.y;
  float y0=wave(x,t,horizon-0.02,0.045,1.1,0.14,1.3);
  float y1=wave(x,t,horizon-0.13,0.055,1.5,0.19,4.1);
  float y2=wave(x,t,horizon-0.26,0.065,1.9,0.26,7.9);
  float m0=smoothstep(y0+px,y0-px,uv.y);col=mix(col,u_r0,m0*0.92);
  float m1=smoothstep(y1+px,y1-px,uv.y);col=mix(col,u_r1,m1*0.92);
  float m2=smoothstep(y2+px,y2-px,uv.y);col=mix(col,u_r2,m2*0.96);
  float l0=line(abs(uv.y-y0),1.3*px,0.020);
  float l1=line(abs(uv.y-y1),1.6*px,0.024);
  float l2=line(abs(uv.y-y2),1.9*px,0.028);
  col=mix(col,u_glow,clamp(l0,0.0,1.0)*(0.5+0.3*u_dark)*u_k);
  col=mix(col,u_glow,clamp(l1,0.0,1.0)*(0.65+0.25*u_dark)*u_k);
  col=mix(col,u_glow,clamp(l2,0.0,1.0)*(0.8+0.2*u_dark)*u_k);
  col+=(hash(gl_FragCoord.xy)-0.5)*0.012;
  gl_FragColor=vec4(col,1.0);
}`;

const TOKENS = [
  '--field-sky-top',
  '--field-sky-horizon',
  '--field-glow',
  '--field-ridge-far',
  '--field-ridge-mid',
  '--field-ridge-near',
] as const;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [0.5, 0.5, 0.5];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Read the palette from the canvas itself, not from `<html>`: custom
 * properties inherit, so this is correct whether the theme class sits on
 * the document root (most apps) or on a scoped app root, as it does in a
 * Module Federation remote living inside someone else's page.
 */
function readPalette(el: Element): [number, number, number][] {
  const cs = getComputedStyle(el);
  return TOKENS.map((t) => hexToRgb(cs.getPropertyValue(t) || '#888888'));
}

function isDark(el: Element): boolean {
  const bg = getComputedStyle(el).getPropertyValue('--field-sky-top').trim();
  const rgb = hexToRgb(bg || '#888888');
  return rgb[0] + rgb[1] + rgb[2] < 1.2;
}

const FALLBACK =
  'linear-gradient(180deg, var(--field-sky-top) 0%, var(--field-sky-horizon) 50%, var(--field-ridge-far) 60%, var(--field-ridge-mid) 76%, var(--field-ridge-near) 100%)';

export function AmbientField({
  variant = 'hero',
  intensity,
  className,
  themeRoot,
}: {
  variant?: 'hero' | 'soft';
  /** 0 to 1. Hero 1, soft 0.55. */
  intensity?: number;
  className?: string;
  /**
   * The element whose class or data attribute switches the theme, watched
   * for repaints. Defaults to `<html>`. Pass the app root when the theme
   * is scoped to a subtree, as in a Module Federation remote.
   */
  themeRoot?: () => Element | null;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [unsupported, setUnsupported] = React.useState(false);
  const k = intensity ?? (variant === 'hero' ? 1 : 0.55);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas || unsupported) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) {
      queueMicrotask(() => setUnsupported(true));
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      queueMicrotask(() => setUnsupported(true));
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      queueMicrotask(() => setUnsupported(true));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u('u_res');
    const uTime = u('u_time');
    const uPointer = u('u_pointer');
    const uDark = u('u_dark');
    const uK = u('u_k');
    const uColors = ['u_sky0', 'u_sky1', 'u_glow', 'u_r0', 'u_r1', 'u_r2'].map(u);

    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
    const FRAME = 1000 / 30;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();
    let raf = 0;
    let running = true;
    let visible = true;
    let last = 0;

    const resize = () => {
      const W = Math.max(1, Math.round(canvas.clientWidth * scale));
      const H = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
        gl.viewport(0, 0, W, H);
      }
    };
    const setPalette = () => {
      const p = readPalette(canvas);
      p.forEach((c, i) => gl.uniform3f(uColors[i], c[0], c[1], c[2]));
      gl.uniform1f(uDark, isDark(canvas) ? 1 : 0);
      gl.uniform1f(uK, k);
    };
    const draw = (now: number) => {
      resize();
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < FRAME) return;
      last = now;
      draw(now);
    };

    setPalette();
    draw(performance.now());
    if (!reduced) raf = requestAnimationFrame(loop);

    // The palette must follow the theme exactly, whatever switches it: a
    // class on <html> (next-themes and most others), a data-theme
    // attribute, or the OS preference with no class at all. Watching the
    // document beats trusting one theme library, and a stale palette is
    // the one failure that makes text unreadable.
    const repaint = () => {
      setPalette();
      draw(performance.now());
    };
    const mo = new MutationObserver(repaint);
    const watched = new Set<Element>([document.documentElement]);
    const scoped = themeRoot?.();
    if (scoped) watched.add(scoped);
    for (const el of watched) {
      mo.observe(el, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', repaint);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = 1 - e.clientY / window.innerHeight;
    };
    if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });
    const onLost = (e: Event) => {
      e.preventDefault();
      setUnsupported(true);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      mo.disconnect();
      mq.removeEventListener('change', repaint);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
      // the context stays with the canvas: a theme change re-runs this
      // effect on the same context, and a lost context cannot be reused
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [reduced, k, unsupported, themeRoot]);

  return (
    <div aria-hidden className={cn('pointer-events-none', className)} style={{ background: FALLBACK }}>
      {!unsupported && <canvas ref={ref} className="block h-full w-full" />}
    </div>
  );
}
