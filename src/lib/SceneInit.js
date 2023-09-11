import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import Stats from 'three/examples/jsm/libs/stats.module';

export default class SceneInit {
    constructor(canvasId) {
        // Initialize Three.js app.
        this.scene = undefined;
        this.camera = undefined;
        this.renderer = undefined;

        // Camera params
        this.fov = 55;
        this.nearPlane = 1;
        this.farPlane = 1000;
        this.canvasId = canvasId;

        // Additional components.
        this.clock = undefined;
        this.stats = undefined;
        this.controls = undefined;

        // Lighting required
        this.ambientLight = undefined;
        this.directionalLight = undefined;
        this.pointLight = undefined;

    }

    initialize() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            this.fov,
            window.innerWidth / window.innerHeight,
            1, 
            1000
        );
        this.camera.position.x = 27;
        this.camera.position.y = 27;
        this.camera.position.z = 27;

        // Specify a canvas which is created in HTML.
        const canvas = document.getElementById(this.canvasId);
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha:true,
            // Anti-aliasing smooths out edges
            antialias: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.clock = new THREE.Clock();
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.stats = Stats();
        document.body.appendChild(this.stats.dom);


        // ambient light for entire scene
//        this.ambientLight = new THREE.AmbientLight(0x004a25, 0.5);
//        this.ambientLight.castShadow = true;
//        this.scene.add(this.ambientLight);

//        // point light - like a pixie hovering 
//        this.pointLight = new THREE.PointLight(0x004a25, 0.5);
//        this.pointLight.position.set(20, 20, 20);
//        this.scene.add(this.pointLight);
//
        // directional light - parallel sun rays
//        this.directionalLight = new THREE.DirectionalLight(0xaddbcb, 0.5);
//        this.directionalLight.castShadow = true;
//        this.directionalLight.position.set(20, 20, 20);
//        this.scene.add(this.directionalLight);

        // if window resizes
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    animate() {
        // NOTE: Window is implied.
        // requestAnimationFrame(this.animate.bind(this));
        window.requestAnimationFrame(this.animate.bind(this));
        this.render();
        this.stats.update();
        this.controls.update();
    }

    render() {
        // Update uniform data on each render.
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}


