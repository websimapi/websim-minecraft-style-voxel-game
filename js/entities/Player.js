import * as THREE from 'three';
import { BlockTypes } from '../world/BlockTypes.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.camera = game.camera;
        this.controls = game.controls;
        this.world = game.world;
        
        // Player physics properties
        this.height = 1.8;
        this.width = 0.6;
        this.eyeHeight = 1.6;
        this.speed = 5.0;
        this.jumpStrength = 8.0;
        this.gravity = 20.0;
        
        // Player state
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.position = new THREE.Vector3(0, 25, 0);
        this.grounded = false;
        this.flying = false;
        this.selectedBlockType = BlockTypes.DIRT;
        
        // Movement input state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        
        // Set initial camera position
        this.camera.position.copy(this.position);
        this.camera.position.y += this.eyeHeight;
        
        // Set up raycaster for block interaction
        this.raycaster = new THREE.Raycaster();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Movement controls
        document.addEventListener('keydown', (event) => {
            if (this.game.paused) return;
            
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space': this.jump = true; break;
                case 'KeyF': this.flying = !this.flying; break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'Space': this.jump = false; break;
            }
        });
        
        // Block interaction
        document.addEventListener('mousedown', (event) => {
            if (this.game.paused || !this.controls.isLocked) return;
            
            if (event.button === 0) { // Left click - break block
                this.breakBlock();
            } else if (event.button === 2) { // Right click - place block
                this.placeBlock();
            }
        });
        
        // Block selection with scroll wheel
        document.addEventListener('wheel', (event) => {
            if (this.game.paused) return;
            
            // Get all block types except AIR
            const blockTypes = [
                BlockTypes.DIRT,
                BlockTypes.GRASS,
                BlockTypes.STONE,
                BlockTypes.SAND,
                BlockTypes.WOOD,
                BlockTypes.LEAVES
            ];
            
            // Find current block index
            const currentIndex = blockTypes.indexOf(this.selectedBlockType);
            
            // Calculate new index based on scroll direction
            let newIndex;
            if (event.deltaY > 0) {
                // Scroll down - next block
                newIndex = (currentIndex + 1) % blockTypes.length;
            } else {
                // Scroll up - previous block
                newIndex = (currentIndex - 1 + blockTypes.length) % blockTypes.length;
            }
            
            this.selectedBlockType = blockTypes[newIndex];
            
            // Update UI
            const selectedBlockName = BlockTypes.getBlockDefinition(this.selectedBlockType).name;
            document.getElementById('selected-block').textContent = selectedBlockName;
        });
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    update(deltaTime) {
        if (this.game.paused) return;
        
        // Apply movement inputs
        this.handleMovement(deltaTime);
        
        // Apply physics (gravity, collision)
        this.applyPhysics(deltaTime);
        
        // Update camera position
        this.camera.position.copy(this.position);
        this.camera.position.y += this.eyeHeight;
    }
    
    handleMovement(deltaTime) {
        const direction = new THREE.Vector3();
        const rotation = this.camera.getWorldDirection(new THREE.Vector3());
        
        // Calculate forward/backward direction (along z-axis)
        const forwardDirection = new THREE.Vector3(-rotation.x, 0, -rotation.z).normalize();
        
        // Calculate left/right direction (perpendicular to forward)
        const rightDirection = new THREE.Vector3(forwardDirection.z, 0, -forwardDirection.x);
        
        // Apply movement based on input
        if (this.moveForward) direction.add(forwardDirection);
        if (this.moveBackward) direction.sub(forwardDirection);
        if (this.moveLeft) direction.sub(rightDirection);
        if (this.moveRight) direction.add(rightDirection);
        
        // Normalize direction vector to maintain consistent speed in all directions
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Apply speed
        direction.multiplyScalar(this.speed * deltaTime);
        
        // Apply horizontal movement
        this.position.x += direction.x;
        this.position.z += direction.z;
        
        // Apply jump
        if (this.jump) {
            if (this.flying) {
                this.velocity.y = this.jumpStrength;
            } else if (this.grounded) {
                this.velocity.y = this.jumpStrength;
                this.grounded = false;
            }
        }
        
        // Apply flying movement
        if (this.flying) {
            // In flying mode, up/down is controlled by looking up/down and moving forward
            this.position.y += direction.y;
            
            // Allow flying up/down with space and shift
            if (this.jump) {
                this.position.y += this.speed * deltaTime;
            }
            
            // Reset velocity and grounded state in flying mode
            this.velocity.y = 0;
            this.grounded = false;
        }
    }
    
    applyPhysics(deltaTime) {
        if (this.flying) return;
        
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Apply vertical velocity
        this.position.y += this.velocity.y * deltaTime;
        
        // Simple collision detection with blocks
        this.handleCollisions();
    }
    
    handleCollisions() {
        // Check for collisions with blocks below (floor)
        const floorY = Math.floor(this.position.y);
        const playerX = Math.floor(this.position.x);
        const playerZ = Math.floor(this.position.z);
        
        // Check if there's a block below the player
        const blockBelow = this.world.getBlockAt(playerX, floorY - 1, playerZ);
        const blockDefinition = BlockTypes.getBlockDefinition(blockBelow);
        
        if (blockDefinition.solid && this.position.y <= floorY + 0.1) {
            // Land on solid block
            this.position.y = floorY + 0.1;
            this.velocity.y = 0;
            this.grounded = true;
        } else {
            // No solid block below
            this.grounded = false;
        }
        
        // Prevent falling through the world by placing a limit
        if (this.position.y < -10) {
            this.position.y = 25;
            this.velocity.y = 0;
        }
        
        // Simplified collision handling for walls
        // This is basic and could be improved with proper box collision
        const checkDirections = [
            [1, 0], [-1, 0], [0, 1], [0, -1]  // Right, left, front, back
        ];
        
        for (const [dx, dz] of checkDirections) {
            const blockX = Math.floor(this.position.x + dx * this.width / 2);
            const blockZ = Math.floor(this.position.z + dz * this.width / 2);
            
            // Check blocks at player's height and head height
            for (let yOffset = 0; yOffset < this.height; yOffset += 0.5) {
                const blockY = Math.floor(this.position.y + yOffset);
                const block = this.world.getBlockAt(blockX, blockY, blockZ);
                
                if (BlockTypes.getBlockDefinition(block).solid) {
                    // Handle horizontal collision by pushing player away
                    if (dx !== 0) {
                        this.position.x = dx > 0 
                            ? blockX - this.width / 2 
                            : blockX + 1 + this.width / 2;
                    }
                    if (dz !== 0) {
                        this.position.z = dz > 0 
                            ? blockZ - this.width / 2 
                            : blockZ + 1 + this.width / 2;
                    }
                    break;
                }
            }
        }
        
        // Check for ceiling collision
        const headY = Math.floor(this.position.y + this.height);
        const blockAbove = this.world.getBlockAt(playerX, headY, playerZ);
        
        if (BlockTypes.getBlockDefinition(blockAbove).solid && 
            this.position.y + this.height > headY) {
            this.position.y = headY - this.height;
            this.velocity.y = Math.min(0, this.velocity.y);
        }
    }
    
    raycast() {
        // Get direction player is looking
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Set raycaster origin and direction
        this.raycaster.set(this.camera.position, direction);
        
        // Maximum reach distance
        const maxDistance = 5;
        
        // Create a custom intersect check function
        const intersectVoxels = (raycaster, maxDist) => {
            // Ray parameters
            const origin = raycaster.ray.origin;
            const direction = raycaster.ray.direction;
            
            // Ray marching variables
            let distance = 0;
            let hitBlock = null;
            let hitPosition = null;
            let hitNormal = null;
            
            // Ray marching step size (smaller = more accurate but slower)
            const stepSize = 0.1;
            
            // Ray march until hit or max distance
            while (distance < maxDist && !hitBlock) {
                // Calculate current position along ray
                const x = origin.x + direction.x * distance;
                const y = origin.y + direction.y * distance;
                const z = origin.z + direction.z * distance;
                
                // Get block at current position
                const blockX = Math.floor(x);
                const blockY = Math.floor(y);
                const blockZ = Math.floor(z);
                const block = this.world.getBlockAt(blockX, blockY, blockZ);
                
                // Check if hit a non-air block
                if (block !== BlockTypes.AIR && 
                    (block !== BlockTypes.WATER || this.selectedBlockType === BlockTypes.WATER)) {
                    hitBlock = block;
                    hitPosition = { x: blockX, y: blockY, z: blockZ };
                    
                    // Calculate hit normal (which face was hit)
                    // This is simplified - a complete implementation would be more accurate
                    const dx = x - blockX - 0.5;
                    const dy = y - blockY - 0.5;
                    const dz = z - blockZ - 0.5;
                    
                    // Find largest component to determine face
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    const absDz = Math.abs(dz);
                    
                    if (absDx > absDy && absDx > absDz) {
                        hitNormal = { x: Math.sign(dx), y: 0, z: 0 };
                    } else if (absDy > absDx && absDy > absDz) {
                        hitNormal = { x: 0, y: Math.sign(dy), z: 0 };
                    } else {
                        hitNormal = { x: 0, y: 0, z: Math.sign(dz) };
                    }
                    
                    break;
                }
                
                // Step along ray
                distance += stepSize;
            }
            
            if (hitBlock) {
                return {
                    block: hitBlock,
                    position: hitPosition,
                    normal: hitNormal,
                    distance: distance
                };
            }
            
            return null;
        };
        
        // Perform the raycast
        return intersectVoxels(this.raycaster, maxDistance);
    }
    
    breakBlock() {
        const hit = this.raycast();
        
        if (hit) {
            // Set the block to air (break it)
            this.world.setBlockAt(
                hit.position.x, 
                hit.position.y, 
                hit.position.z, 
                BlockTypes.AIR
            );
        }
    }
    
    placeBlock() {
        const hit = this.raycast();
        
        if (hit) {
            // Calculate position for new block based on hit face
            const newX = hit.position.x + hit.normal.x;
            const newY = hit.position.y + hit.normal.y;
            const newZ = hit.position.z + hit.normal.z;
            
            // Check if new position overlaps with player
            const playerMinX = Math.floor(this.position.x - this.width / 2);
            const playerMaxX = Math.floor(this.position.x + this.width / 2);
            const playerMinY = Math.floor(this.position.y);
            const playerMaxY = Math.floor(this.position.y + this.height);
            const playerMinZ = Math.floor(this.position.z - this.width / 2);
            const playerMaxZ = Math.floor(this.position.z + this.width / 2);
            
            const overlapsPlayer = (
                newX >= playerMinX && newX <= playerMaxX &&
                newY >= playerMinY && newY <= playerMaxY &&
                newZ >= playerMinZ && newZ <= playerMaxZ
            );
            
            // Place block if it doesn't overlap with player
            if (!overlapsPlayer) {
                this.world.setBlockAt(newX, newY, newZ, this.selectedBlockType);
            }
        }
    }
}

