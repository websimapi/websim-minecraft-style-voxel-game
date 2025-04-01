import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world/World.js';
import { Player } from './entities/Player.js';
import { BlockTypes } from './world/BlockTypes.js';
import { UI } from './ui/UI.js';
import { InputHandler } from './controls/InputHandler.js';
import { DatabaseManager } from './storage/DatabaseManager.js';
import { isMobile } from './utils/DeviceDetector.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupControls();
        
        this.db = new DatabaseManager();
        this.world = new World(this);
        this.player = new Player(this);
        this.ui = new UI(this);
        this.input = new InputHandler(this);
        
        this.paused = false;
        this.lastTime = 0;
        this.debugMode = false;
        
        this.mobileMode = isMobile();
        if (this.mobileMode) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
        
        this.init();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x87CEEB); // Sky blue
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Add a simple skybox/background
        const fogColor = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(fogColor, 20, 16 * 8); // Fog starts at 20 units and ends at render distance
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 25, 0);
    }
    
    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);
        
        this.controls.addEventListener('lock', () => {
            this.paused = false;
            this.ui.hideMenu();
        });
        
        this.controls.addEventListener('unlock', () => {
            this.paused = true;
            this.ui.showMenu();
        });
    }
    
    init() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.canvas.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });
        
        // Initialize the world
        this.world.init();
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    gameLoop(time) {
        requestAnimationFrame(this.gameLoop.bind(this));
        
        if (this.paused) return;
        
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        // Update game components
        this.player.update(deltaTime);
        this.world.update(deltaTime);
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Update HUD
        this.ui.update();
    }
    
    saveGame() {
        this.world.saveToDatabase();
        console.log('Game saved!');
    }
    
    loadGame() {
        this.world.loadFromDatabase();
        console.log('Game loaded!');
    }
    
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log('Debug mode:', this.debugMode);
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

