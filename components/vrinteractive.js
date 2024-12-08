import * as AFRAME from "aframe";

AFRAME.registerComponent("vrinteractive", {
  schema: {
    triggerEnabled: { type: "boolean", default: true },
    gripEnabled: { type: "boolean", default: true },
    clickAnimation: { type: "boolean", default: true },
    highlightColor: { type: "color", default: "#666666" },
  },

  init() {
    this.originalScale = this.el.object3D.scale.clone();
    this.originalColor = null;
    this.isHighlighted = false;
    this.setupVRInteractions();
  },

  setupVRInteractions() {
    // Add necessary classes
    this.el.classList.add("interactive", "clickable");

    // Handle controller raycaster intersection
    this.el.addEventListener("raycaster-intersected", (evt) => {
      this.raycaster = evt.detail.el.components.raycaster;
      this.intersecting = true;
      if (this.data.clickAnimation) {
        this.highlightElement(true);
      }
    });

    this.el.addEventListener("raycaster-intersected-cleared", (evt) => {
      this.intersecting = false;
      this.raycaster = null;
      if (this.data.clickAnimation) {
        this.highlightElement(false);
      }
    });

    // Handle controller button presses
    if (this.data.triggerEnabled) {
      this.el.addEventListener("triggerdown", () => this.handleInteraction());
      this.el.addEventListener("triggerup", () => this.handleInteractionEnd());
    }

    if (this.data.gripEnabled) {
      this.el.addEventListener("gripdown", () => this.handleInteraction());
      this.el.addEventListener("gripup", () => this.handleInteractionEnd());
    }
  },

  handleInteraction() {
    if (!this.intersecting) return;

    // Animate scale down
    if (this.data.clickAnimation) {
      this.el.object3D.scale.multiplyScalar(0.9);
    }
    // Emit click event for other components to handle
    this.el.emit("click", { source: "vr-controller" }, true);
  },

  handleInteractionEnd() {
    if (!this.intersecting) return;

    // Restore original scale
    if (this.data.clickAnimation) {
      this.el.object3D.scale.copy(this.originalScale);
    }
  },

  highlightElement(highlight) {
    const mesh = this.el.getObject3D("mesh");
    if (!mesh) return;

    // Store original color on first intersection
    if (!this.originalColor && mesh.material) {
      this.originalColor = mesh.material.color.clone();
    }

    // Skip if already in desired highlight state
    if (this.isHighlighted === highlight) return;

    if (mesh.material) {
      if (highlight) {
        mesh.material.color.set(this.data.highlightColor);
      } else {
        mesh.material.color.copy(this.originalColor);
      }
    }

    this.isHighlighted = highlight;
  },

  remove() {
    // Clean up by restoring original appearance
    if (this.data.clickAnimation) {
      this.el.object3D.scale.copy(this.originalScale);
      this.highlightElement(false);
    }
  },
});
