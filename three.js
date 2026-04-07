import { Application } from 'https://cdn.jsdelivr.net/npm/@splinetool/runtime@1.0.64/+esm';

class SplineBackground {
    constructor(selector, url) {
        this.container = document.querySelector(selector.startsWith('#') ? selector : '#' + selector);
        if (!this.container) return;

        this.url = url;
        this.init();
    }

    async init() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spline-canvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        // Initialize Spline Application
        this.app = new Application(this.canvas);

        try {
            await this.app.load(this.url);
            
            // Search for globe object
            this.globe = this.app.findObjectByName('Globe') || 
                         this.app.findObjectByName('Earth') || 
                         this.app.findObjectByName('Sphere'); 
            
            if (this.globe) {
                console.log('Spline: Object found and scaled for better visibility');
                this.globe.scale.set(1.2, 1.2, 1.2);
                this.animate(); // Start manual rotation loop
            }
        } catch (err) {
            console.error('Spline Loader Error:', err);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.globe) {
            this.globe.rotation.y += 0.002; 
        }
    }
}

export default SplineBackground;
