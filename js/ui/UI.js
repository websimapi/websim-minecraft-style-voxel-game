import { BlockTypes } from '../world/BlockTypes.js';

export class UI {
    constructor(game) {
        this.game = game;
        this.debugElement = document.getElementById('debug-info');
        this.selectedBlockElement = document.getElementById('selected-block');
        this.menuElement = document.getElementById('menu-ui');
        this.inventoryElement = document.getElementById('inventory-ui');
        
        this.setupEventListeners();
        this.initInventory();
        this.updateSelectedBlock();
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('resume-game').addEventListener('click', () => {
            this.game.controls.lock();
        });
        
        document.getElementById('save-game').addEventListener('click', () => {
            this.game.saveGame();
        });
        
        document.getElementById('load-game').addEventListener('click', () => {
            this.game.loadGame();
        });
        
        // Settings
        document.getElementById('render-distance').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('render-distance-value').textContent = value;
            this.game.world.renderDistance = value;
        });
        
        // Inventory
        document.getElementById('close-inventory').addEventListener('click', () => {
            this.hideInventory();
            this.game.controls.lock();
        });
        
        // Toggle inventory with E key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE') {
                if (this.inventoryElement.classList.contains('hidden')) {
                    this.showInventory();
                    this.game.controls.unlock();
                } else {
                    this.hideInventory();
                    this.game.controls.lock();
                }
            }
            
            // Toggle debug info with F3
            if (e.code === 'F3') {
                this.game.toggleDebugMode();
            }
        });
    }
    
    initInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        
        // Create inventory slots and fill with block types
        const blockTypes = [
            BlockTypes.DIRT,
            BlockTypes.GRASS,
            BlockTypes.STONE,
            BlockTypes.SAND,
            BlockTypes.WATER,
            BlockTypes.WOOD,
            BlockTypes.LEAVES
        ];
        
        blockTypes.forEach((blockType, index) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            if (blockType === this.game.player.selectedBlockType) {
                slot.classList.add('selected');
            }
            
            // Use block color for inventory representation
            const blockDef = BlockTypes.getBlockDefinition(blockType);
            const r = Math.floor(blockDef.color[0] * 255);
            const g = Math.floor(blockDef.color[1] * 255);
            const b = Math.floor(blockDef.color[2] * 255);
            
            slot.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            slot.dataset.blockType = blockType;
            slot.title = blockDef.name;
            
            // Add click handler to select block
            slot.addEventListener('click', () => {
                this.game.player.selectedBlockType = blockType;
                
                // Update selection UI
                document.querySelectorAll('.inventory-slot').forEach(el => {
                    el.classList.remove('selected');
                });
                slot.classList.add('selected');
                
                this.updateSelectedBlock();
            });
            
            inventoryGrid.appendChild(slot);
        });
    }
    
    updateSelectedBlock() {
        const blockDef = BlockTypes.getBlockDefinition(this.game.player.selectedBlockType);
        this.selectedBlockElement.textContent = blockDef.name;
    }
    
    showMenu() {
        this.menuElement.classList.remove('hidden');
    }
    
    hideMenu() {
        this.menuElement.classList.add('hidden');
    }
    
    showInventory() {
        this.inventoryElement.classList.remove('hidden');
    }
    
    hideInventory() {
        this.inventoryElement.classList.add('hidden');
    }
    
    update() {
        if (this.game.debugMode) {
            // Update debug info
            const player = this.game.player;
            const camera = this.game.camera;
            const chunkX = Math.floor(camera.position.x / this.game.world.chunkSize);
            const chunkY = Math.floor(camera.position.y / this.game.world.chunkSize);
            const chunkZ = Math.floor(camera.position.z / this.game.world.chunkSize);
            
            this.debugElement.textContent = 
                `FPS: ${Math.round(1 / (this.game.lastTime || 0.016))}\n` +
                `XYZ: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}\n` +
                `Chunk: ${chunkX}, ${chunkY}, ${chunkZ}\n` +
                `Chunks loaded: ${this.game.world.chunks.size}\n` +
                `Chunks to update: ${this.game.world.dirtyChunks.size}\n` +
                `Flying: ${player.flying ? 'ON' : 'OFF'}`;
            
            this.debugElement.style.display = 'block';
        } else {
            this.debugElement.style.display = 'none';
        }
    }
}

