export class InputHandler {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        this.isMobile = game.mobileMode;
        
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        if (!this.isMobile) return;
        
        const movementPad = document.getElementById('movement-pad');
        const jumpButton = document.getElementById('jump-button');
        const placeButton = document.getElementById('place-button');
        const breakButton = document.getElementById('break-button');
        
        // Set up touch joystick for movement
        let movementActive = false;
        let centerX = 0;
        let centerY = 0;
        
        movementPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = movementPad.getBoundingClientRect();
            
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            
            movementActive = true;
            
            // Process movement
            this.processTouchMovement(touch.clientX, touch.clientY, centerX, centerY);
        });
        
        movementPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (!movementActive) return;
            
            const touch = e.touches[0];
            
            // Process movement
            this.processTouchMovement(touch.clientX, touch.clientY, centerX, centerY);
        });
        
        movementPad.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            movementActive = false;
            
            // Reset player movement
            this.player.moveForward = false;
            this.player.moveBackward = false;
            this.player.moveLeft = false;
            this.player.moveRight = false;
        });
        
        // Jump button
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.jump = true;
        });
        
        jumpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.player.jump = false;
        });
        
        // Place button
        placeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.placeBlock();
        });
        
        // Break button
        breakButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.breakBlock();
        });
        
        // Touch look controls for camera
        document.addEventListener('touchmove', (e) => {
            // Only handle camera rotation if not on controls
            if (e.target === this.game.canvas) {
                e.preventDefault();
                
                if (e.touches.length === 1) {
                    // Handle one finger drag for looking around
                    const touch = e.touches[0];
                    const movementX = touch.clientX - this.prevTouchX || 0;
                    const movementY = touch.clientY - this.prevTouchY || 0;
                    
                    this.prevTouchX = touch.clientX;
                    this.prevTouchY = touch.clientY;
                    
                    // Apply rotation to camera
                    // This is a simplified version - a real implementation would be smoother
                    this.game.camera.rotation.y -= movementX * 0.01;
                    this.game.camera.rotation.x -= movementY * 0.01;
                    
                    // Clamp vertical rotation
                    this.game.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.game.camera.rotation.x));
                }
            }
        });
        
        document.addEventListener('touchstart', (e) => {
            if (e.target === this.game.canvas) {
                e.preventDefault();
                const touch = e.touches[0];
                this.prevTouchX = touch.clientX;
                this.prevTouchY = touch.clientY;
            }
        });
    }
    
    processTouchMovement(touchX, touchY, centerX, centerY) {
        // Calculate direction based on where the touch is relative to center
        const dx = touchX - centerX;
        const dy = touchY - centerY;
        
        // Determine direction based on angle
        const angle = Math.atan2(dy, dx);
        
        // Reset movement flags
        this.player.moveForward = false;
        this.player.moveBackward = false;
        this.player.moveLeft = false;
        this.player.moveRight = false;
        
        // Set movement based on angle (8 direction zones)
        if (angle >= -Math.PI/8 && angle < Math.PI/8) {
            this.player.moveRight = true;
        } else if (angle >= Math.PI/8 && angle < 3*Math.PI/8) {
            this.player.moveRight = true;
            this.player.moveBackward = true;
        } else if (angle >= 3*Math.PI/8 && angle < 5*Math.PI/8) {
            this.player.moveBackward = true;
        } else if (angle >= 5*Math.PI/8 && angle < 7*Math.PI/8) {
            this.player.moveLeft = true;
            this.player.moveBackward = true;
        } else if (angle >= 7*Math.PI/8 || angle < -7*Math.PI/8) {
            this.player.moveLeft = true;
        } else if (angle >= -7*Math.PI/8 && angle < -5*Math.PI/8) {
            this.player.moveLeft = true;
            this.player.moveForward = true;
        } else if (angle >= -5*Math.PI/8 && angle < -3*Math.PI/8) {
            this.player.moveForward = true;
        } else if (angle >= -3*Math.PI/8 && angle < -Math.PI/8) {
            this.player.moveRight = true;
            this.player.moveForward = true;
        }
    }
}

