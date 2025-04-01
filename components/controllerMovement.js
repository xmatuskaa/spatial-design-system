import * as AFRAME from "aframe";

AFRAME.registerComponent("controller-movement", {
  schema: {
    speed: { type: "number", default: 1 },
    hand: { type: "string", default: "left", oneOf: ["left", "right"] }
  },

  init() {
    this.cameraRigEl = null;
    this.movementVector = new THREE.Vector3();
    this.worldDirection = new THREE.Vector3();

    // Bind methods
    this.findCameraRig = this.findCameraRig.bind(this);
    this.onAxisMove = this.onAxisMove.bind(this);

    // Find camera rig when scene loads
    if (this.el.sceneEl.hasLoaded) {
      this.findCameraRig();
    } else {
      this.el.sceneEl.addEventListener('loaded', this.findCameraRig);
    }
  },

  findCameraRig() {
    // Try multiple selectors to find camera rig
    this.cameraRigEl = this.el.sceneEl.querySelector("#rig") || 
                       this.el.sceneEl.querySelector("[camera-rig]") || 
                       this.el.sceneEl.querySelector("a-camera").parentNode;

    if (this.cameraRigEl) {
      // Set up tracked controls
      this.el.setAttribute('tracked-controls', {
        hand: this.data.hand
      });

      // Listen for axis move events
      this.el.addEventListener('axismove', this.onAxisMove);
    }
  },

  onAxisMove(evt) {
    // Ensure camera rig exists
    if (!this.cameraRigEl) return;

    // Extract axis values (thumbstick is typically axes[2] and axes[3])
    const axisX = evt.detail.axis[2] || evt.detail.axis[0] || 0;
    const axisY = evt.detail.axis[3] || evt.detail.axis[1] || 0;

    // Apply deadzone
    const deadzone = 0.2;
    if (Math.abs(axisX) < deadzone && Math.abs(axisY) < deadzone) {
      return;
    }

    // Get camera's world direction
    const camera = this.el.sceneEl.camera;
    camera.getWorldDirection(this.worldDirection);

    // Calculate movement in camera's local space
    const moveX = axisX * this.data.speed/10;
    const moveZ = axisY * this.data.speed/10;

    // Transform movement to world space
    this.movementVector.set(moveX, 0, moveZ);
    this.movementVector.applyQuaternion(camera.quaternion);

    // Move the camera rig
    this.cameraRigEl.object3D.position.add(this.movementVector);
  },

  remove() {
    // Remove event listeners
    if (this.el) {
      this.el.removeEventListener('axismove', this.onAxisMove);
    }

    if (this.el.sceneEl) {
      this.el.sceneEl.removeEventListener('loaded', this.findCameraRig);
    }
  }
});