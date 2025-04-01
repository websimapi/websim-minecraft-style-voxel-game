export class DatabaseManager {
    constructor() {
        this.dbName = 'voxel-game-db';
        this.dbVersion = 1;
        this.db = null;
        
        this.init();
    }
    
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                console.error('Error opening database:', event);
                reject(event);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create an object store for the world data
                if (!db.objectStoreNames.contains('world')) {
                    const worldStore = db.createObjectStore('world', { keyPath: 'id' });
                    console.log('World object store created');
                }
                
                // Create an object store for player data
                if (!db.objectStoreNames.contains('player')) {
                    const playerStore = db.createObjectStore('player', { keyPath: 'id' });
                    console.log('Player object store created');
                }
            };
        });
    }
    
    saveWorld(worldData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('Database not initialized');
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction(['world'], 'readwrite');
            const worldStore = transaction.objectStore('world');
            
            // Save world data with id 'main-world'
            const saveData = {
                id: 'main-world',
                data: worldData,
                timestamp: Date.now()
            };
            
            const request = worldStore.put(saveData);
            
            request.onsuccess = (event) => {
                console.log('World data saved successfully');
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error saving world data:', event);
                reject(event);
            };
        });
    }
    
    getWorld() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('Database not initialized');
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction(['world'], 'readonly');
            const worldStore = transaction.objectStore('world');
            
            const request = worldStore.get('main-world');
            
            request.onsuccess = (event) => {
                const savedData = event.target.result;
                if (savedData) {
                    console.log('World data loaded successfully');
                    resolve(savedData.data);
                } else {
                    console.log('No saved world data found');
                    resolve(null);
                }
            };
            
            request.onerror = (event) => {
                console.error('Error loading world data:', event);
                reject(event);
            };
        });
    }
    
    savePlayer(playerData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('Database not initialized');
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction(['player'], 'readwrite');
            const playerStore = transaction.objectStore('player');
            
            // Save player data with id 'main-player'
            const saveData = {
                id: 'main-player',
                data: playerData,
                timestamp: Date.now()
            };
            
            const request = playerStore.put(saveData);
            
            request.onsuccess = (event) => {
                console.log('Player data saved successfully');
                resolve();
            };
            
            request.onerror = (event) => {
                console.error('Error saving player data:', event);
                reject(event);
            };
        });
    }
    
    getPlayer() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('Database not initialized');
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction(['player'], 'readonly');
            const playerStore = transaction.objectStore('player');
            
            const request = playerStore.get('main-player');
            
            request.onsuccess = (event) => {
                const savedData = event.target.result;
                if (savedData) {
                    console.log('Player data loaded successfully');
                    resolve(savedData.data);
                } else {
                    console.log('No saved player data found');
                    resolve(null);
                }
            };
            
            request.onerror = (event) => {
                console.error('Error loading player data:', event);
                reject(event);
            };
        });
    }
    
    clearDatabase() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('Database not initialized');
                reject('Database not initialized');
                return;
            }
            
            const transaction = this.db.transaction(['world', 'player'], 'readwrite');
            const worldStore = transaction.objectStore('world');
            const playerStore = transaction.objectStore('player');
            
            const worldRequest = worldStore.clear();
            const playerRequest = playerStore.clear();
            
            worldRequest.onsuccess = (event) => {
                console.log('World data cleared successfully');
            };
            
            playerRequest.onsuccess = (event) => {
                console.log('Player data cleared successfully');
                resolve();
            };
            
            transaction.onerror = (event) => {
                console.error('Error clearing database:', event);
                reject(event);
            };
        });
    }
}

