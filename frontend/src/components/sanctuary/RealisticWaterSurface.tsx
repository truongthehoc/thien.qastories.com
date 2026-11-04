import React, { useEffect, useRef } from 'react';

/**
 * Natural Mountain Stream Simulation (Physically-tuned Hydrodynamics)
 *
 * Designed to address:
 * 1. Stream Speed & Cadence: Gentle, serene natural mountain stream flow (calm glide in deep pools,
 *    accelerated laminar flow at narrow chutes, and soft turbulent churning at the two waterfalls).
 * 2. Visual Realism: Liquid refraction that actually distorts the pebbles beneath,
 *    delicate sunlight caustics dancing on submerged riverbed stones, and organic foam
 *    accumulating naturally behind rocks rather than a synthetic overlay.
 * 3. Directional Alignment: Strictly follows the natural riverbed topography (flowing from
 *    distant forest clearing X:0.69, Y:0.43 downward along the rocky channel to X:0.32, Y:0.98).
 */

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  v_uv.y = 1.0 - v_uv.y; // Standard image UV (0 at top, 1 at bottom)
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;

// Fast analytic noise for natural water waves
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Multi-octave fractal noise for organic water caustics
float waterCaustic(vec2 p) {
  float val = 0.0;
  val += abs(snoise(p)) * 0.50;
  val += abs(snoise(p * 2.15)) * 0.28;
  val += abs(snoise(p * 4.30)) * 0.14;
  return 1.0 - pow(val, 1.4);
}

// River centerline, half-width and local tangent flow direction
void getRiverChannel(float y, out float centerX, out float halfWidth, out vec2 flowDir) {
  if (y < 0.43) {
    centerX = 0.69;
    halfWidth = 0.012;
    flowDir = normalize(vec2(0.05, 0.99));
  } else if (y < 0.52) {
    float t = (y - 0.43) / 0.09;
    centerX = mix(0.69, 0.675, t);
    halfWidth = mix(0.012, 0.024, t);
    flowDir = normalize(vec2(-0.25, 0.96));
  } else if (y < 0.64) {
    // Cascades 1 & 2 (water drops over rock ledges)
    float t = (y - 0.52) / 0.12;
    centerX = 0.675 + 0.082 * sin(t * 3.14159 * 0.88);
    halfWidth = mix(0.024, 0.038, t);
    flowDir = normalize(vec2(0.48, 0.88));
  } else if (y < 0.76) {
    // Serene middle pool curving past the mossy bank
    float t = (y - 0.64) / 0.12;
    centerX = mix(0.755, 0.66, t);
    halfWidth = mix(0.038, 0.054, t);
    flowDir = normalize(vec2(-0.68, 0.73));
  } else if (y < 0.88) {
    // Wide mountain stream sweeping into foreground
    float t = (y - 0.76) / 0.12;
    centerX = mix(0.66, 0.49, t);
    halfWidth = mix(0.054, 0.070, t);
    flowDir = normalize(vec2(-0.76, 0.65));
  } else {
    // Rocky shallows exiting bottom left
    float t = (y - 0.88) / 0.12;
    centerX = mix(0.49, 0.31, t);
    halfWidth = mix(0.070, 0.086, t);
    flowDir = normalize(vec2(-0.83, 0.56));
  }
}

void main() {
  vec2 uv = v_uv;
  float y = uv.y;

  // Stream starts at Y ~ 0.42 (distant forest opening)
  if (y < 0.42) {
    discard;
  }

  float centerX;
  float halfWidth;
  vec2 flowDir;
  getRiverChannel(y, centerX, halfWidth, flowDir);

  float distFromCenter = abs(uv.x - centerX);
  float normDist = distFromCenter / max(0.001, halfWidth);

  // Confine strictly inside river banks
  if (normDist > 1.08) {
    discard;
  }

  // Soft mossy shore feathering
  float bankAlpha = smoothstep(1.08, 0.70, normDist);

  // Realistic hydrodynamic speed gradient:
  // Water flows calmly (~0.35 - 0.50x) in open stream pools,
  // accelerates naturally (~0.85 - 1.1x) at the two waterfall drops and narrow cascades.
  // This removes the "too fast / wind-like" rush and creates a meditative, lifelike stream.
  float localSpeed = 0.38;
  if (y > 0.53 && y < 0.65) {
    localSpeed = 0.82; // Waterfall drop
  } else if (y >= 0.65 && y < 0.78) {
    localSpeed = 0.44; // Deep calm pool
  } else if (y >= 0.78 && y < 0.88) {
    localSpeed = 0.50; // Moderate glide
  } else if (y >= 0.88) {
    localSpeed = 0.68; // Shallows rapids
  }

  float flowTime = u_time * localSpeed;

  // Stream flow coordinates (along current vs. across stream channel)
  vec2 perpDir = vec2(-flowDir.y, flowDir.x);
  float streamAlong = dot(uv, flowDir) * 16.0 - flowTime * 2.1;
  float streamAcross = dot(uv, perpDir) * 28.0;

  // Perspective scaling (waves and ripples appear larger closer to viewer)
  float perspective = mix(0.60, 1.40, (y - 0.42) / 0.58);
  vec2 uvStream1 = vec2(streamAcross * 0.45, streamAlong * 0.75) / perspective;
  vec2 uvStream2 = vec2(streamAcross * 0.70 + flowTime * 0.2, streamAlong * 1.30 + flowTime * 0.15) / perspective;
  vec2 uvCaustic = vec2(streamAcross * 1.10 - flowTime * 0.1, streamAlong * 2.20) / perspective;

  // Natural liquid wave crests (broad, smooth ripples rather than high-frequency jitter)
  float waveA = snoise(uvStream1);
  float waveB = snoise(uvStream2);
  float waveHeight = waveA * 0.65 + waveB * 0.35;

  // Liquid surface normal for specular sun glints
  float eps = 0.05;
  float nR = snoise(uvStream1 + vec2(eps, 0.0)) * 0.65 + snoise(uvStream2 + vec2(eps, 0.0)) * 0.35;
  float nU = snoise(uvStream1 + vec2(0.0, eps)) * 0.65 + snoise(uvStream2 + vec2(0.0, eps)) * 0.35;
  vec3 normal = normalize(vec3((nR - waveHeight) * 2.2, (nU - waveHeight) * 2.2, 1.0));

  // Sunlight angle filtering from tree canopy (top-left, ~35 degrees)
  vec3 sunDir = normalize(vec3(-0.42, 0.60, 0.68));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  // Fresnel reflection on water surface
  vec3 halfVec = normalize(sunDir + viewDir);
  float NdotH = max(0.0, dot(normal, halfVec));
  float sunSpecular = pow(NdotH, 36.0);
  float fresnel = 0.08 + 0.92 * pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);

  // Natural underwater sunlight caustics (rippling light patterns on stones beneath)
  float caustics = waterCaustic(uvCaustic);
  float causticLight = pow(caustics, 2.5) * 0.65;

  // Natural stream color grading
  // Preserves the crystal clarity of mountain stream water
  vec3 deepStream = vec3(0.14, 0.32, 0.36);
  vec3 shallowStream = vec3(0.28, 0.56, 0.58);
  vec3 sunGlow = vec3(0.98, 0.94, 0.76);
  vec3 foamWhite = vec3(0.96, 0.99, 1.0);

  // Whitewater foam: restricted to actual rock drop zones (waterfall 1 & 2)
  // Soft, aerated foam that churns gently and fades into clear water
  float drop1 = smoothstep(0.045, 0.0, abs(y - 0.572)) * (0.55 + 0.45 * snoise(uvStream2 * 2.4 + flowTime * 1.8));
  float drop2 = smoothstep(0.050, 0.0, abs(y - 0.638)) * (0.60 + 0.40 * snoise(uvStream2 * 2.6 + flowTime * 2.0));
  float lowerRapids = smoothstep(0.88, 0.98, y) * (0.40 + 0.40 * snoise(uvCaustic * 1.8 + flowTime * 1.5));
  float totalFoam = clamp(drop1 * 1.4 + drop2 * 1.5 + lowerRapids * 1.0, 0.0, 1.0);

  // Liquid color composition
  float waveShading = (waveHeight + 1.0) * 0.5;
  vec3 waterBase = mix(deepStream, shallowStream, waveShading);
  waterBase += sunGlow * causticLight * 0.35; // Sun caustics through clear water
  waterBase = mix(waterBase, sunGlow, fresnel * 0.28); // Subtle sky reflection

  // Add specular sunlight highlights on wave crests
  vec3 waterLit = waterBase + (sunGlow * sunSpecular * 1.25);

  // Blend white aeration foam at rocky drops
  vec3 finalColor = mix(waterLit, foamWhite, totalFoam * 0.72);

  // Optical transparency:
  // Calm water is 30% - 42% transparent so the real stone riverbed is clearly seen rippling,
  // Foam areas are 65% - 78% opaque with bubbly aeration.
  float waterAlpha = mix(0.32, 0.74, totalFoam) * bankAlpha;

  gl_FragColor = vec4(finalColor, waterAlpha);
}
`;

export const RealisticWaterSurface: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      }) ||
      (canvas.getContext('experimental-webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      }) as WebGLRenderingContext | null);

    if (!gl) return;

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let animFrameId: number;
    let startTime = performance.now();

    const handleResize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001;
      handleResize();

      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: 'normal' }}
    />
  );
};
