import * as THREE from 'three';

export class JoyConVisualizer {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Scene setup
        this.scene = new THREE.Scene();
        // Transparent background so CSS gradient shows through
        this.scene.background = null;

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 0, 18);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-5, -5, -10);
        this.scene.add(backLight);

        // JoyCon Group
        this.joyconGroup = new THREE.Group();
        this.scene.add(this.joyconGroup);

        // Build the model
        this.buildModel();

        // State
        this.isConnected = false;
        this.targetRotation = 0;
        this.autoRotateAngle = 0;

        // Overlay element for hint (Sync Button)
        this.createOverlay();

        // Start loop
        this.animate = this.animate.bind(this);
        this.animate();

        // Resize handler
        window.addEventListener('resize', () => {
             this.onResize();
        });
    }

    createOverlay() {
        // Create a DOM element to point at the sync button
        this.hintLabel = document.createElement('div');
        this.hintLabel.className = 'joycon-3d-hint';
        this.hintLabel.innerHTML = `
            <div class="hint-arrow">←</div>
            <div class="hint-text">シンクロボタン<br><small>長押し</small></div>
        `;
        this.container.appendChild(this.hintLabel);
        this.updateHintVisibility(true);
    }

    updateHintVisibility(visible) {
        if (this.hintLabel) {
            this.hintLabel.style.opacity = visible ? '1' : '0';
            this.hintLabel.style.pointerEvents = visible ? 'auto' : 'none';
        }
    }

    buildModel() {
        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xff3b2e, // Neon Red
            roughness: 0.4,
            metalness: 0.1
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });
        const railMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });
        const ledOnMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const ledOffMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

        // 1. Main Body (Rounded Box approximation)
        // Using a scaled cylinder or box with rounded corners geometry would be better,
        // but for simplicity, we'll use a Box and scale it.
        // Actually, a CapsuleGeometry is available in newer Three.js, but let's stick to BoxGeometry for safety
        // or a Cylinder for the rounded ends.

        // Let's comprise it of a center box and two cylinders for top/bottom roundness?
        // No, visual style "Blocky but smooth".

        const bodyGeo = new THREE.BoxGeometry(3.5, 10, 1.2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);

        // Chamfer/Round edges (simulated by scale or just keep blocky)
        // Let's add side curves (cylinders)
        const sideGeo = new THREE.CylinderGeometry(1.2/2, 1.2/2, 10, 16);
        const leftSide = new THREE.Mesh(sideGeo, bodyMat);
        leftSide.position.x = -1.75;
        // leftSide.rotation.z = Math.PI / 2; // Oh wait, cylinder default is Y-up.
        // We want it along the Y axis of the body.

        // Actually, JoyCon shape:
        // Front view: ( )
        // Let's just use a Box for main and Cylinders for edges to make it "Pill" shaped?
        // No, JoyCon is flat on one side (rail side).
        // Let's assume Right JoyCon (Flat on Left, Rounded on Right).

        // Body Center
        const mainBody = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 1.2), bodyMat);
        mainBody.position.x = 0;
        this.joyconGroup.add(mainBody);

        // Rounded Right Edge
        const rightEdge = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 32, 1, false, 0, Math.PI), bodyMat);
        rightEdge.position.x = 1.5;
        rightEdge.rotation.y = 0; // Default Cylinder is Y up. We want semicircle?
        // Cylinder geometry defaults to full circle.
        // thetaLength = Math.PI makes it a half cylinder.
        // BUT rotation needs to align.
        // Cylinder is vertical. We want the curved surface to face +X.
        rightEdge.rotation.y = -Math.PI / 2;
        this.joyconGroup.add(rightEdge);

        // Flat Left Edge (Rail Side)
        // We put a "Rail" strip here.
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 10, 1.2), railMat);
        rail.position.x = -1.75;
        this.joyconGroup.add(rail);

        // 2. Analog Stick
        const stickBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), darkMat);
        stickBase.position.set(0, 2.5, 0.65);
        stickBase.rotation.x = Math.PI / 2;
        this.joyconGroup.add(stickBase);

        const stickTop = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16), darkMat);
        stickTop.position.set(0, 2.5, 0.85);
        stickTop.rotation.x = Math.PI / 2;
        this.joyconGroup.add(stickTop);

        // 3. Face Buttons (A, B, X, Y)
        const btnGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
        const btnPos = [
            {x: 0, y: -2, z: 0.65},   // B (Bottom)
            {x: 0, y: -0.6, z: 0.65}, // X (Top)
            {x: -0.7, y: -1.3, z: 0.65}, // Y (Left)
            {x: 0.7, y: -1.3, z: 0.65}   // A (Right)
        ];
        btnPos.forEach(pos => {
            const btn = new THREE.Mesh(btnGeo, darkMat);
            btn.position.set(pos.x, pos.y, pos.z);
            btn.rotation.x = Math.PI / 2;
            this.joyconGroup.add(btn);
        });

        // 4. Plus Button
        const plusV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.1), darkMat);
        const plusH = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.1), darkMat);
        plusV.position.set(1.0, 3.5, 0.65);
        plusH.position.set(1.0, 3.5, 0.65);
        this.joyconGroup.add(plusV);
        this.joyconGroup.add(plusH);

        // 5. Home Button
        const homeBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), darkMat); // Should be transparent/lit really but dark is fine
        homeBtn.position.set(0, -4, 0.65);
        homeBtn.rotation.x = Math.PI / 2;
        // Ring around home button
        const homeRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16), darkMat); // Too complex?
        this.joyconGroup.add(homeBtn);

        // 6. SYNC BUTTON & LEDs (Crucial part)
        // Rail is at x = -1.75. Face is -X.

        // Sync Button (Small circle)
        // Positioned in the middle of the rail.
        this.syncButton = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16), darkMat);
        this.syncButton.position.set(-2.0, 0.5, 0); // Stick out slightly from rail (-1.75 - 0.25 width)
        this.syncButton.rotation.z = Math.PI / 2;
        this.joyconGroup.add(this.syncButton);

        // LEDs (4 dots)
        for(let i=0; i<4; i++) {
            const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), ledOffMat);
            led.position.set(-2.0, -0.5 - (i * 0.4), 0);
            this.joyconGroup.add(led);
        }

        // SL / SR Buttons (Top/Bottom of rail)
        const slBtn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.5), darkMat);
        slBtn.position.set(-2.0, 2.5, 0);
        this.joyconGroup.add(slBtn);

        const srBtn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.5), darkMat);
        srBtn.position.set(-2.0, -2.5, 0);
        this.joyconGroup.add(srBtn);
    }

    setConnected(connected) {
        this.isConnected = connected;
        // If connected, hide the helper overlay
        this.updateHintVisibility(!connected);
    }

    setRotation(angleDegrees) {
        // Z-rotation for the face rotation
        this.targetRotation = angleDegrees * (Math.PI / 180);
    }

    onResize() {
        if (!this.container) return;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        if (!this.isConnected) {
            // "Scanning" animation - slowly rotate to show the side
            // We want to show the 'Rail' (Left side of model).
            // Model faces +Z. Left is -X.
            // We want to rotate Y so -X faces camera (+Z).
            // That means rotation.y should oscillate around -Math.PI / 2 (or +Math.PI / 2 depending on coord sys).

            // Auto rotate
            // Slow sway to show the button
            const time = Date.now() * 0.002;
            // Base rotation: Show the side (Rail at -X creates rotation Y = +90deg to face camera)
            // Wait, if Rail is at -X, and camera is at +Z.
            // Rotating +90deg Y-axis brings -X to +Z.
            const baseAngle = Math.PI / 2;

            // Sway +/- 20 degrees
            this.joyconGroup.rotation.y = baseAngle + Math.sin(time) * 0.3;
            // Tilt slightly to see top/bottom
            this.joyconGroup.rotation.x = Math.sin(time * 0.5) * 0.1;
            this.joyconGroup.rotation.z = 0;

            // Update Hint Position
            // Project the Sync Button position to 2D
            if (this.syncButton && this.hintLabel) {
                // Get world position of sync button
                const vector = new THREE.Vector3();
                this.syncButton.getWorldPosition(vector);
                vector.project(this.camera);

                const x = (vector.x * 0.5 + 0.5) * this.width;
                const y = (-(vector.y * 0.5) + 0.5) * this.height;

                // Move label
                this.hintLabel.style.transform = `translate(${x + 20}px, ${y - 10}px)`; // Offset slightly
            }

        } else {
            // Connected: Controlled mainly by external angle (Z-rotation usually for steering)
            // But here we might want to reset the Y rotation to 0 (Face forward)

            // Smoothly interpolate Y to 0
            this.joyconGroup.rotation.y += (0 - this.joyconGroup.rotation.y) * 0.1;
            this.joyconGroup.rotation.x += (0 - this.joyconGroup.rotation.x) * 0.1;

            // Apply the sensor rotation to Z
            // Invert if necessary based on data
            this.joyconGroup.rotation.z = -this.targetRotation;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
