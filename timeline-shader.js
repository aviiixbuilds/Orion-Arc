/**
 * HIGH-PERFORMANCE GRID SHADER
 * Ported from GLSL to Vanilla JS WebGL2
 * Optimized for Orion Arc Timeline Background (Dark Variant)
 */

class TimelineShader {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true, alpha: true });
        if (!this.gl) return;

        this.startTime = performance.now();
        this.mouse = { x: 0, y: 0, l: 0, r: 0 };
        
        this.init();
        this.setupEvents();
        this.onResize();
        this.animate();
    }

    init() {
        const gl = this.gl;

        const vertSrc = `#version 300 es
            in vec2 a_pos;
            out vec2 v_uv;
            void main() {
                v_uv = a_pos * 0.5 + 0.5;
                gl_Position = vec4(a_pos, 0.0, 1.0);
            }
        `;

        const fragSrc = `#version 300 es
            precision highp float;
            out vec4 fragColor;
            in vec2 v_uv;

            uniform vec3 iResolution;
            uniform float iTime;
            uniform vec4 iMouse;

            const float GRID_SCALE = 18.0;
            const float MAJOR_STEP = 4.0;
            const float THIN_WIDTH = 0.008;
            const float MAJOR_WIDTH = 0.012;
            const float SCROLL_SPEED = 0.015;

            const float VIGNETTE_AMT = 0.4;
            const float MESH_AMT = 0.6;
            const float NOISE_AMT = 0.02;

            mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

            float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
            float vnoise(vec2 p) {
                vec2 i = floor(p), f = fract(p);
                float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
            }

            float gridLineAA(vec2 uv, float scale, float width) {
                vec2 g = abs(fract(uv * scale) - 0.5);
                float d = min(g.x, g.y);
                float aa = fwidth(d);
                return 1.0 - smoothstep(width, width + aa, d);
            }

            vec3 meshGradient(vec2 uv) {
                // DARKER VARIANT COLORS
                vec2 p0 = vec2(-0.7, -0.45);
                vec3 c0 = vec3(0.01, 0.02, 0.06); // Extremely deep navy
                vec2 p1 = vec2(0.75, -0.35);
                vec3 c1 = vec3(0.02, 0.04, 0.1);  // Dark navy
                vec2 p2 = vec2(-0.65, 0.65);
                vec3 c2 = vec3(0.005, 0.01, 0.03); // Near black
                vec2 p3 = vec2(0.8, 0.55);
                vec3 c3 = vec3(0.03, 0.06, 0.15); // Deep cobalt
                
                float e = 2.0;
                float w0 = pow(1.0 / (0.3 + distance(uv, p0)), e);
                float w1 = pow(1.0 / (0.3 + distance(uv, p1)), e);
                float w2 = pow(1.0 / (0.3 + distance(uv, p2)), e);
                float w3 = pow(1.0 / (0.3 + distance(uv, p3)), e);
                return (c0 * w0 + c1 * w1 + c2 * w2 + c3 * w3) / (w0 + w1 + w2 + w3);
            }

            void main() {
                vec2 R = iResolution.xy;
                vec2 uv = (gl_FragCoord.xy - 0.5 * R) / max(R.y, 1.0);
                
                vec3 bg = meshGradient(uv);
                float rad = length(uv);
                bg *= clamp(1.5 - VIGNETTE_AMT * rad, 0.0, 1.0);

                vec2 scrollDir = normalize(vec2(1.0, -0.55));
                vec2 uvAnim = uv + SCROLL_SPEED * iTime * scrollDir;

                float thin = gridLineAA(uvAnim, GRID_SCALE, THIN_WIDTH);
                float major = gridLineAA(uvAnim, GRID_SCALE / MAJOR_STEP, MAJOR_WIDTH);

                // Subdued grid colors for darker theme
                vec3 lineThin = vec3(0.15, 0.25, 0.5); 
                vec3 lineMajor = vec3(0.3, 0.45, 0.8);

                vec3 col = bg + (lineThin * thin * 0.1) + (lineMajor * major * 0.2);

                float n = vnoise(gl_FragCoord.xy * 0.6 + vec2(iTime * 12.0, -iTime * 9.0));
                col += (n - 0.5) * NOISE_AMT;

                fragColor = vec4(tanh(col), 1.0);
            }
        `;

        this.program = this.createProgram(vertSrc, fragSrc);
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.uResolution = gl.getUniformLocation(this.program, 'iResolution');
        this.uTime = gl.getUniformLocation(this.program, 'iTime');
        this.uMouse = gl.getUniformLocation(this.program, 'iMouse');
    }

    createProgram(vsSrc, fsSrc) {
        const gl = this.gl;
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSrc);
        gl.compileShader(vs);
        
        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSrc);
        gl.compileShader(fs);

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        return prog;
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = rect.height - (e.clientY - rect.top);
        });
    }

    onResize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    animate() {
        const gl = this.gl;
        const time = (performance.now() - this.startTime) / 1000;

        gl.useProgram(this.program);
        gl.uniform3f(this.uResolution, this.canvas.width, this.canvas.height, 1);
        gl.uniform1f(this.uTime, time);
        gl.uniform4f(this.uMouse, this.mouse.x, this.mouse.y, this.mouse.l, this.mouse.r);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        requestAnimationFrame(() => this.animate());
    }
}

// Global initialization
window.initTimelineShader = () => {
    new TimelineShader('timeline-canvas');
};
