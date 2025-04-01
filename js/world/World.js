import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { Chunk } from './Chunk.js';
import { BlockTypes } from './BlockTypes.js';

export class World {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.chunks = new Map(); // Map of chunk keys to chunk objects
        this.meshes = new Map(); // Map of chunk keys to chunk meshes
        this.chunkSize = 16;
        this.renderDistance = 4; // In chunks
        this.noise2D = createNoise2D();
        this.maxHeight = 32;
        this.seaLevel = 12;
        this.dirtyChunks = new Set(); // Chunks that need mesh updates
        
        // Material and texture setup
        this.setupMaterials();
    }
    
    setupMaterials() {
        // Create a texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Create texture atlas (in a real implementation, you'd use a proper atlas)
        this.textureAtlas = textureLoader.load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAFUlEQVRYhe3BAQ0AAADCoPdPbQ43oAAA3A8BQTwAAQ2qHUYAAAAASUVORK5CYII=');
        this.textureAtlas.magFilter = THREE.NearestFilter;
        this.textureAtlas.minFilter = THREE.NearestFilter;
        
        // Material for all voxels
        this.material = new THREE.MeshLambertMaterial({
            map: this.textureAtlas,
            vertexColors: true,
            transparent: false,
            alphaTest: 0.1
        });
    }
    
    init() {
        // Generate initial chunks around spawn point
        this.generateInitialChunks();
    }
    
    generateInitialChunks() {
        const center = new THREE.Vector3(0, 0, 0);
        this.updateChunks(center);
    }
    
    getChunkKeyFromPosition(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        return `${chunkX},${chunkY},${chunkZ}`;
    }
    
    getChunkKey(chunkX, chunkY, chunkZ) {
        return `${chunkX},${chunkY},${chunkZ}`;
    }
    
    getBlockAt(x, y, z) {
        const chunkKey = this.getChunkKeyFromPosition(x, y, z);
        const chunk = this.chunks.get(chunkKey);
        
        if (!chunk) return 0; // Air/empty
        
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((y % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        
        return chunk.getBlock(localX, localY, localZ);
    }
    
    setBlockAt(x, y, z, blockType) {
        const chunkKey = this.getChunkKeyFromPosition(x, y, z);
        let chunk = this.chunks.get(chunkKey);
        
        if (!chunk) {
            const chunkX = Math.floor(x / this.chunkSize);
            const chunkY = Math.floor(y / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            chunk = new Chunk(this, chunkX, chunkY, chunkZ);
            this.chunks.set(chunkKey, chunk);
        }
        
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((y % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        
        chunk.setBlock(localX, localY, localZ, blockType);
        this.dirtyChunks.add(chunkKey);
        
        // Update adjacent chunks if block is on the edge
        if (localX === 0) this.dirtyChunks.add(this.getChunkKey(chunk.x - 1, chunk.y, chunk.z));
        if (localX === this.chunkSize - 1) this.dirtyChunks.add(this.getChunkKey(chunk.x + 1, chunk.y, chunk.z));
        if (localY === 0) this.dirtyChunks.add(this.getChunkKey(chunk.x, chunk.y - 1, chunk.z));
        if (localY === this.chunkSize - 1) this.dirtyChunks.add(this.getChunkKey(chunk.x, chunk.y + 1, chunk.z));
        if (localZ === 0) this.dirtyChunks.add(this.getChunkKey(chunk.x, chunk.y, chunk.z - 1));
        if (localZ === this.chunkSize - 1) this.dirtyChunks.add(this.getChunkKey(chunk.x, chunk.y, chunk.z + 1));
    }
    
    generateChunk(chunkX, chunkY, chunkZ) {
        const chunk = new Chunk(this, chunkX, chunkY, chunkZ);
        
        // Only generate terrain for chunks that are within reasonable height
        if (chunkY >= -1 && chunkY <= Math.ceil(this.maxHeight / this.chunkSize)) {
            for (let localX = 0; localX < this.chunkSize; localX++) {
                for (let localZ = 0; localZ < this.chunkSize; localZ++) {
                    // Get world coordinates
                    const worldX = chunkX * this.chunkSize + localX;
                    const worldZ = chunkZ * this.chunkSize + localZ;
                    
                    // Generate terrain height using noise
                    const elevation = this.generateElevation(worldX, worldZ);
                    
                    // Fill blocks in this column
                    for (let localY = 0; localY < this.chunkSize; localY++) {
                        const worldY = chunkY * this.chunkSize + localY;
                        
                        if (worldY < elevation - 4) {
                            // Deep stone layer
                            chunk.setBlock(localX, localY, localZ, BlockTypes.STONE);
                        } else if (worldY < elevation) {
                            // Dirt layer with stone patches
                            const stoneProbability = (elevation - worldY) / 4;
                            chunk.setBlock(localX, localY, localZ, Math.random() < stoneProbability ? BlockTypes.STONE : BlockTypes.DIRT);
                        } else if (worldY === elevation) {
                            // Surface layer - grass or sand near water
                            if (elevation <= this.seaLevel + 1) {
                                chunk.setBlock(localX, localY, localZ, BlockTypes.SAND);
                            } else {
                                chunk.setBlock(localX, localY, localZ, BlockTypes.GRASS);
                            }
                        } else if (worldY <= this.seaLevel && worldY > elevation) {
                            // Water layer
                            chunk.setBlock(localX, localY, localZ, BlockTypes.WATER);
                        } else {
                            // Air above terrain or water
                            chunk.setBlock(localX, localY, localZ, BlockTypes.AIR);
                        }
                    }
                }
            }
        }
        
        return chunk;
    }
    
    generateElevation(x, z) {
        // Simple terrain generation using noise
        const scale = 0.01;
        const octaves = 4;
        let elevation = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxAmplitude = 0;
        
        for (let i = 0; i < octaves; i++) {
            const noiseValue = this.noise2D(x * scale * frequency, z * scale * frequency);
            elevation += noiseValue * amplitude;
            maxAmplitude += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        // Normalize and scale to terrain height
        elevation = (elevation / maxAmplitude) * 0.5 + 0.5;
        elevation = Math.floor(elevation * this.maxHeight);
        
        return elevation;
    }
    
    updateChunks(playerPosition) {
        const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const playerChunkY = Math.floor(playerPosition.y / this.chunkSize);
        const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
        
        const chunksToKeep = new Set();
        
        // Generate or update chunks within render distance
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                // Only load chunks near the player's height
                for (let y = -2; y <= 2; y++) {
                    const chunkX = playerChunkX + x;
                    const chunkY = playerChunkY + y;
                    const chunkZ = playerChunkZ + z;
                    
                    const distanceSquared = x * x + z * z;
                    if (distanceSquared <= this.renderDistance * this.renderDistance) {
                        const chunkKey = this.getChunkKey(chunkX, chunkY, chunkZ);
                        chunksToKeep.add(chunkKey);
                        
                        if (!this.chunks.has(chunkKey)) {
                            const chunk = this.generateChunk(chunkX, chunkY, chunkZ);
                            this.chunks.set(chunkKey, chunk);
                            this.dirtyChunks.add(chunkKey);
                        }
                    }
                }
            }
        }
        
        // Remove chunks outside render distance
        for (const chunkKey of this.chunks.keys()) {
            if (!chunksToKeep.has(chunkKey)) {
                // Remove mesh from scene
                if (this.meshes.has(chunkKey)) {
                    const mesh = this.meshes.get(chunkKey);
                    this.scene.remove(mesh);
                    mesh.geometry.dispose();
                    this.meshes.delete(chunkKey);
                }
                
                // Remove chunk data
                this.chunks.delete(chunkKey);
                this.dirtyChunks.delete(chunkKey);
            }
        }
    }
    
    update(deltaTime) {
        // Update chunks based on player position
        this.updateChunks(this.game.camera.position);
        
        // Update meshes for dirty chunks
        this.updateDirtyChunks();
    }
    
    updateDirtyChunks() {
        let count = 0;
        const maxUpdatesPerFrame = 5; // Limit updates to maintain framerate
        
        for (const chunkKey of this.dirtyChunks) {
            if (count >= maxUpdatesPerFrame) break;
            
            const chunk = this.chunks.get(chunkKey);
            if (chunk) {
                this.updateChunkMesh(chunk);
                count++;
            }
            
            this.dirtyChunks.delete(chunkKey);
        }
    }
    
    updateChunkMesh(chunk) {
        const chunkKey = this.getChunkKey(chunk.x, chunk.y, chunk.z);
        
        // Remove old mesh if it exists
        if (this.meshes.has(chunkKey)) {
            const oldMesh = this.meshes.get(chunkKey);
            this.scene.remove(oldMesh);
            oldMesh.geometry.dispose();
        }
        
        // Generate new mesh for the chunk
        const { positions, normals, indices, uvs, colors } = chunk.generateMesh();
        
        if (indices.length === 0) {
            // No visible blocks in this chunk
            this.meshes.delete(chunkKey);
            return;
        }
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, this.material);
        mesh.position.set(
            chunk.x * this.chunkSize,
            chunk.y * this.chunkSize,
            chunk.z * this.chunkSize
        );
        
        // Add to scene and store reference
        this.scene.add(mesh);
        this.meshes.set(chunkKey, mesh);
    }
    
    saveToDatabase() {
        // Serialize all chunks
        const worldData = {
            chunks: {}
        };
        
        for (const [key, chunk] of this.chunks.entries()) {
            if (!chunk.isEmpty()) {
                worldData.chunks[key] = chunk.serialize();
            }
        }
        
        // Save to IndexedDB
        this.game.db.saveWorld(worldData);
    }
    
    loadFromDatabase() {
        this.game.db.getWorld().then(worldData => {
            if (!worldData) {
                console.log('No saved world found.');
                return;
            }
            
            // Clear existing world
            for (const mesh of this.meshes.values()) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
            }
            
            this.chunks.clear();
            this.meshes.clear();
            this.dirtyChunks.clear();
            
            // Load chunks from saved data
            for (const [key, chunkData] of Object.entries(worldData.chunks)) {
                const [x, y, z] = key.split(',').map(Number);
                const chunk = new Chunk(this, x, y, z);
                chunk.deserialize(chunkData);
                this.chunks.set(key, chunk);
                this.dirtyChunks.add(key);
            }
            
            console.log(`Loaded ${Object.keys(worldData.chunks).length} chunks.`);
        });
    }
}

