export const BlockTypes = {
    AIR: 0,
    DIRT: 1,
    GRASS: 2,
    STONE: 3,
    WATER: 4,
    SAND: 5,
    WOOD: 6,
    LEAVES: 7,
    
    getBlockDefinition(blockType) {
        // Block definitions with properties
        const definitions = {
            [this.AIR]: {
                solid: false,
                transparent: true,
                color: [1.0, 1.0, 1.0],
                name: "Air"
            },
            [this.DIRT]: {
                solid: true,
                transparent: false,
                color: [0.6, 0.35, 0.2],
                name: "Dirt"
            },
            [this.GRASS]: {
                solid: true,
                transparent: false,
                color: [0.3, 0.8, 0.2],
                name: "Grass"
            },
            [this.STONE]: {
                solid: true,
                transparent: false,
                color: [0.5, 0.5, 0.5],
                name: "Stone"
            },
            [this.WATER]: {
                solid: false,
                transparent: true,
                color: [0.2, 0.5, 0.9],
                name: "Water"
            },
            [this.SAND]: {
                solid: true,
                transparent: false,
                color: [0.9, 0.8, 0.5],
                name: "Sand"
            },
            [this.WOOD]: {
                solid: true,
                transparent: false,
                color: [0.5, 0.35, 0.1],
                name: "Wood"
            },
            [this.LEAVES]: {
                solid: true,
                transparent: true,
                color: [0.2, 0.6, 0.2],
                name: "Leaves"
            }
        };
        
        return definitions[blockType] || definitions[this.AIR];
    }
};

