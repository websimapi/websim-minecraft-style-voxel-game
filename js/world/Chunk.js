import * as THREE from 'three';
import { BlockTypes } from './BlockTypes.js';

export class Chunk {
    constructor(world, x, y, z) {
        this.world = world;
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = world.chunkSize;
        
        // Create 3D array to store block data
        this.blocks = new Uint8Array(this.size * this.size * this.size);
        
        // Initialize with air blocks
        this.blocks.fill(BlockTypes.AIR);
    }
    
    getIndex(x, y, z) {
        return x + y * this.size + z * this.size * this.size;
    }
    
    getBlock(x, y, z) {
        return this.blocks[this.getIndex(x, y, z)];
    }
    
    setBlock(x, y, z, blockType) {
        this.blocks[this.getIndex(x, y, z)] = blockType;
    }
    
    isEmpty() {
        // Check if chunk contains only air blocks
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i] !== BlockTypes.AIR) {
                return false;
            }
        }
        return true;
    }
    
    isBlockFaceVisible(x, y, z, face) {
        // Check if this block face should be rendered
        // We need to check the adjacent block in the direction of the face
        
        let nx = x, ny = y, nz = z;
        
        // Determine coordinates of the neighboring block
        switch (face) {
            case 0: nx += 1; break; // Right face (+X)
            case 1: nx -= 1; break; // Left face (-X)
            case 2: ny += 1; break; // Top face (+Y)
            case 3: ny -= 1; break; // Bottom face (-Y)
            case 4: nz += 1; break; // Front face (+Z)
            case 5: nz -= 1; break; // Back face (-Z)
        }
        
        // Check if neighbor is outside chunk bounds
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size || nz < 0 || nz >= this.size) {
            // Get block from neighboring chunk
            const worldX = this.x * this.size + x;
            const worldY = this.y * this.size + y;
            const worldZ = this.z * this.size + z;
            
            const neighborWorldX = worldX + (nx - x);
            const neighborWorldY = worldY + (ny - y);
            const neighborWorldZ = worldZ + (nz - z);
            
            const neighborBlock = this.world.getBlockAt(neighborWorldX, neighborWorldY, neighborWorldZ);
            return this.isTransparent(neighborBlock);
        }
        
        // Check neighbor within the same chunk
        const neighborBlock = this.getBlock(nx, ny, nz);
        return this.isTransparent(neighborBlock);
    }
    
    isTransparent(blockType) {
        // Check if a block type is transparent (should render faces behind it)
        return blockType === BlockTypes.AIR || blockType === BlockTypes.WATER;
    }
    
    generateMesh() {
        // Greedy meshing implementation for optimized geometry
        // This is a simplified version - a full implementation would merge faces
        
        const positions = [];
        const normals = [];
        const indices = [];
        const uvs = [];
        const colors = [];
        
        let vertexIndex = 0;
        
        // Vertex positions for a cube
        const cubeVertices = [
            // Right face (0)
            { pos: [1, 0, 0], norm: [1, 0, 0], uv: [0, 1] },
            { pos: [1, 1, 0], norm: [1, 0, 0], uv: [1, 1] },
            { pos: [1, 1, 1], norm: [1, 0, 0], uv: [1, 0] },
            { pos: [1, 0, 1], norm: [1, 0, 0], uv: [0, 0] },
            
            // Left face (1)
            { pos: [0, 0, 1], norm: [-1, 0, 0], uv: [0, 0] },
            { pos: [0, 1, 1], norm: [-1, 0, 0], uv: [1, 0] },
            { pos: [0, 1, 0], norm: [-1, 0, 0], uv: [1, 1] },
            { pos: [0, 0, 0], norm: [-1, 0, 0], uv: [0, 1] },
            
            // Top face (2)
            { pos: [0, 1, 0], norm: [0, 1, 0], uv: [0, 1] },
            { pos: [0, 1, 1], norm: [0, 1, 0], uv: [0, 0] },
            { pos: [1, 1, 1], norm: [0, 1, 0], uv: [1, 0] },
            { pos: [1, 1, 0], norm: [0, 1, 0], uv: [1, 1] },
            
            // Bottom face (3)
            { pos: [0, 0, 0], norm: [0, -1, 0], uv: [0, 0] },
            { pos: [1, 0, 0], norm: [0, -1, 0], uv: [1, 0] },
            { pos: [1, 0, 1], norm: [0, -1, 0], uv: [1, 1] },
            { pos: [0, 0, 1], norm: [0, -1, 0], uv: [0, 1] },
            
            // Front face (4)
            { pos: [0, 0, 1], norm: [0, 0, 1], uv: [0, 1] },
            { pos: [1, 0, 1], norm: [0, 0, 1], uv: [1, 1] },
            { pos: [1, 1, 1], norm: [0, 0, 1], uv: [1, 0] },
            { pos: [0, 1, 1], norm: [0, 0, 1], uv: [0, 0] },
            
            // Back face (5)
            { pos: [1, 0, 0], norm: [0, 0, -1], uv: [0, 1] },
            { pos: [0, 0, 0], norm: [0, 0, -1], uv: [1, 1] },
            { pos: [0, 1, 0], norm: [0, 0, -1], uv: [1, 0] },
            { pos: [1, 1, 0], norm: [0, 0, -1], uv: [0, 0] }
        ];
        
        // Iterate through all blocks in the chunk
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const blockType = this.getBlock(x, y, z);
                    
                    // Skip air blocks
                    if (blockType === BlockTypes.AIR) continue;
                    
                    // Get block properties
                    const blockDef = BlockTypes.getBlockDefinition(blockType);
                    
                    // Add faces for this block
                    for (let face = 0; face < 6; face++) {
                        // Check if face needs to be rendered
                        if (this.isBlockFaceVisible(x, y, z, face)) {
                            // Get the 4 vertices for this face
                            const faceVertices = cubeVertices.slice(face * 4, face * 4 + 4);
                            
                            // Add vertices to mesh
                            for (const vertex of faceVertices) {
                                // Position
                                positions.push(
                                    x + vertex.pos[0],
                                    y + vertex.pos[1],
                                    z + vertex.pos[2]
                                );
                                
                                // Normal
                                normals.push(...vertex.norm);
                                
                                // UV mapping with texture atlas
                                // This is simplified - a real implementation would map to a texture atlas
                                const u = vertex.uv[0];
                                const v = vertex.uv[1];
                                uvs.push(u, v);
                                
                                // Color (used as a placeholder for texture)
                                colors.push(...blockDef.color);
                            }
                            
                            // Add indices for two triangles (6 indices)
                            indices.push(
                                vertexIndex, vertexIndex + 1, vertexIndex + 2,
                                vertexIndex, vertexIndex + 2, vertexIndex + 3
                            );
                            
                            vertexIndex += 4;
                        }
                    }
                }
            }
        }
        
        return { positions, normals, indices, uvs, colors };
    }
    
    serialize() {
        // Convert block data to compressed format for storage
        // In a real implementation, you might want to use a more efficient compression
        const nonEmptyBlocks = [];
        
        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i] !== BlockTypes.AIR) {
                const x = i % this.size;
                const y = Math.floor(i / this.size) % this.size;
                const z = Math.floor(i / (this.size * this.size));
                nonEmptyBlocks.push([x, y, z, this.blocks[i]]);
            }
        }
        
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            blocks: nonEmptyBlocks
        };
    }
    
    deserialize(data) {
        // Reset to air
        this.blocks.fill(BlockTypes.AIR);
        
        // Set blocks from saved data
        for (const [x, y, z, blockType] of data.blocks) {
            this.setBlock(x, y, z, blockType);
        }
    }
}

