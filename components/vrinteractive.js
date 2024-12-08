import * as AFRAME from "aframe";

AFRAME.registerComponent("vrinteractive", {
  schema: {
    triggerEnabled: { type: "boolean", default: true },
    gripEnabled: { type: "boolean", default: true },
    clickAnimation: { type: "boolean", default: true },
    highlightColor: { type: "color", default: "#666666" },
    borderWidth: { type: "number", default: 2 }, // Line width in pixels
  },

  init() {
    this.originalScale = this.el.object3D.scale.clone();
    this.borderLine = null;
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
      this.handleInteractionEnd();
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
      if (this.borderLine) {
        this.borderLine.scale.copy(this.originalScale);
      }
    }
  },

  highlightElement(highlight) {
    const mesh = this.el.getObject3D("mesh");
    if (!mesh) return;

    // Skip if already in desired highlight state
    if (this.isHighlighted === highlight) return;

    if (highlight) {
      // Create border if it doesn't exist
      if (!this.borderLine) {
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;

        // Create edges geometry
        const edges = new THREE.EdgesGeometry(geometry);

        // Create line material
        const material = new THREE.LineBasicMaterial({
          color: this.data.highlightColor,
          linewidth: this.data.borderWidth,
          transparent: true,
          opacity: 1,
        });

        // Create line segments
        this.borderLine = new THREE.LineSegments(edges, material);

        // Position the border slightly in front of the mesh to prevent z-fighting
        this.borderLine.position.z = 0.001;

        // Add the border to the object's 3D group
        mesh.parent.add(this.borderLine);
      }
      this.borderLine.visible = true;
    } else {
      // Hide the border
      if (this.borderLine) {
        this.borderLine.visible = false;
      }
    }

    this.isHighlighted = highlight;
  },

  remove() {
    // Clean up by removing the border line
    if (this.borderLine && this.borderLine.parent) {
      this.borderLine.parent.remove(this.borderLine);
    }

    if (this.data.clickAnimation) {
      this.el.object3D.scale.copy(this.originalScale);
    }
  },

  update(oldData) {
    // Update border color if it changed
    if (
      oldData.highlightColor &&
      this.data.highlightColor !== oldData.highlightColor
    ) {
      if (this.borderLine) {
        this.borderLine.material.color.set(this.data.highlightColor);
      }
    }

    // Update border width if it changed
    if (oldData.borderWidth && this.data.borderWidth !== oldData.borderWidth) {
      if (this.borderLine) {
        this.borderLine.material.linewidth = this.data.borderWidth;
      }
    }
  },
});
