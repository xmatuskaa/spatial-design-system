import * as AFRAME from "aframe";

/**
 * VR Interactive Component
 * 
 * Adds VR controller interaction to elements, with visual feedback
 * including hover highlighting and click animations.
 * 
 * @namespace spatial-design-system
 * @component vrinteractive
 */
AFRAME.registerComponent("vrinteractive", {
  schema: {
    triggerEnabled: { type: "boolean", default: true },
    gripEnabled: { type: "boolean", default: true },
    clickAnimation: { type: "boolean", default: true },
    highlightEnabled: { type: "boolean", default: true },
    highlightColor: { type: "color", default: "#666666" },
    highlightOpacity: { type: "number", default: 1.0 },
    borderWidth: { type: "number", default: 2 },
    scaleOnClick: { type: "number", default: 0.9 },
    highlightDistance: { type: "number", default: 0.001 }
  },

  init() {
    // Store original scale to restore after interactions
    this.originalScale = this.el.object3D.scale.clone();
    this.borderLine = null;
    this.isHighlighted = false;
    this.intersecting = false;
    
    // Bind methods to maintain correct 'this' context
    this.onRaycasterIntersected = this.onRaycasterIntersected.bind(this);
    this.onRaycasterIntersectedCleared = this.onRaycasterIntersectedCleared.bind(this);
    this.handleInteraction = this.handleInteraction.bind(this);
    this.handleInteractionEnd = this.handleInteractionEnd.bind(this);
    
    this.setupVRInteractions();
  },

  setupVRInteractions() {
    // Add necessary classes
    this.el.classList.add("interactive", "clickable");

    // Handle controller raycaster intersection
    this.el.addEventListener("raycaster-intersected", this.onRaycasterIntersected);
    this.el.addEventListener("raycaster-intersected-cleared", this.onRaycasterIntersectedCleared);

    // Handle controller button presses
    if (this.data.triggerEnabled) {
      this.el.addEventListener("triggerdown", this.handleInteraction);
      this.el.addEventListener("triggerup", this.handleInteractionEnd);
    }

    if (this.data.gripEnabled) {
      this.el.addEventListener("gripdown", this.handleInteraction);
      this.el.addEventListener("gripup", this.handleInteractionEnd);
    }
  },
  
  onRaycasterIntersected(evt) {
    this.raycaster = evt.detail.el.components.raycaster;
    this.intersecting = true;
    
    if (this.data.highlightEnabled) {
      this.highlightElement(true);
    }
  },
  
  onRaycasterIntersectedCleared(evt) {
    this.handleInteractionEnd();
    this.intersecting = false;
    this.raycaster = null;
    
    if (this.data.highlightEnabled) {
      this.highlightElement(false);
    }
  },

  handleInteraction() {
    if (!this.intersecting) return;

    // Animate scale down
    if (this.data.clickAnimation) {
      this.el.object3D.scale.multiplyScalar(this.data.scaleOnClick);
    }
    
    // Emit click event for other components to handle
    this.el.emit("click", { source: "vr-controller" }, true);
  },

  handleInteractionEnd() {
    if (!this.intersecting) return;

    // Restore original scale
    if (this.data.clickAnimation) {
      this.el.object3D.scale.copy(this.originalScale);
      
      // Also scale the border if it exists
      if (this.borderLine) {
        this.borderLine.scale.copy(this.originalScale);
      }
    }
  },

  highlightElement(highlight) {
    // Skip if already in desired highlight state
    if (this.isHighlighted === highlight) return;
    
    const mesh = this.el.getObject3D("mesh");
    if (!mesh) {
      // Attempt to find another object3D if mesh is not available
      for (const key in this.el.object3D.children) {
        if (this.el.object3D.children[key].isMesh) {
          mesh = this.el.object3D.children[key];
          break;
        }
      }
      
      if (!mesh) return;
    }

    if (highlight) {
      // Create border if it doesn't exist
      if (!this.borderLine) {
        try {
          const geometry = mesh.geometry;
          
          if (!geometry) {
            console.warn('VRInteractive: No geometry found for highlight');
            return;
          }
          
          // Create edges geometry
          const edges = new THREE.EdgesGeometry(geometry);

          // Create line material
          const material = new THREE.LineBasicMaterial({
            color: this.data.highlightColor,
            linewidth: this.data.borderWidth,
            transparent: true,
            opacity: this.data.highlightOpacity
          });

          // Create line segments
          this.borderLine = new THREE.LineSegments(edges, material);

          // Position the border slightly in front of the mesh to prevent z-fighting
          this.borderLine.position.z = this.data.highlightDistance;

          // Add the border to the object's 3D group
          mesh.parent.add(this.borderLine);
        } catch (error) {
          console.error("VRInteractive: Error creating highlight", error);
        }
      }
      
      if (this.borderLine) {
        this.borderLine.visible = true;
      }
    } else {
      // Hide the border
      if (this.borderLine) {
        this.borderLine.visible = false;
      }
    }

    this.isHighlighted = highlight;
  },

  update(oldData) {
    // Update highlight color if it changed
    if (this.borderLine) {
      // Check if highlight color changed
      if (oldData.highlightColor !== undefined && 
          this.data.highlightColor !== oldData.highlightColor) {
        this.borderLine.material.color.set(this.data.highlightColor);
      }
      
      // Check if highlight opacity changed
      if (oldData.highlightOpacity !== undefined && 
          this.data.highlightOpacity !== oldData.highlightOpacity) {
        this.borderLine.material.opacity = this.data.highlightOpacity;
      }
    }
    
    // Handle changes to event listening
    this.updateEventListeners(oldData);
  },
  
  updateEventListeners(oldData) {
    // Update trigger event listeners if changed
    if (oldData.triggerEnabled !== undefined && 
        this.data.triggerEnabled !== oldData.triggerEnabled) {
      if (this.data.triggerEnabled) {
        this.el.addEventListener("triggerdown", this.handleInteraction);
        this.el.addEventListener("triggerup", this.handleInteractionEnd);
      } else {
        this.el.removeEventListener("triggerdown", this.handleInteraction);
        this.el.removeEventListener("triggerup", this.handleInteractionEnd);
      }
    }
    
    // Update grip event listeners if changed
    if (oldData.gripEnabled !== undefined && 
        this.data.gripEnabled !== oldData.gripEnabled) {
      if (this.data.gripEnabled) {
        this.el.addEventListener("gripdown", this.handleInteraction);
        this.el.addEventListener("gripup", this.handleInteractionEnd);
      } else {
        this.el.removeEventListener("gripdown", this.handleInteraction);
        this.el.removeEventListener("gripup", this.handleInteractionEnd);
      }
    }
  },

  remove() {
    // Clean up by removing the border line
    if (this.borderLine && this.borderLine.parent) {
      this.borderLine.parent.remove(this.borderLine);
      this.borderLine.geometry.dispose();
      this.borderLine.material.dispose();
      this.borderLine = null;
    }

    // Reset scale
    if (this.data.clickAnimation) {
      this.el.object3D.scale.copy(this.originalScale);
    }
    
    // Remove event listeners
    this.el.removeEventListener("raycaster-intersected", this.onRaycasterIntersected);
    this.el.removeEventListener("raycaster-intersected-cleared", this.onRaycasterIntersectedCleared);
    
    if (this.data.triggerEnabled) {
      this.el.removeEventListener("triggerdown", this.handleInteraction);
      this.el.removeEventListener("triggerup", this.handleInteractionEnd);
    }
    
    if (this.data.gripEnabled) {
      this.el.removeEventListener("gripdown", this.handleInteraction);
      this.el.removeEventListener("gripup", this.handleInteractionEnd);
    }
  }
});