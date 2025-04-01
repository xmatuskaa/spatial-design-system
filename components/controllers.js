import * as AFRAME from "aframe";

/**
 * Controllers Component
 * 
 * Sets up VR controllers with raycasters for interaction.
 * Creates controller entities with customizable properties.
 * 
 * @namespace spatial-design-system
 * @component controllers
 */
AFRAME.registerComponent("controllers", {
  schema: {
    leftEnabled: { type: "boolean", default: true },
    rightEnabled: { type: "boolean", default: true },
    leftColor: { type: "color", default: "#ff5555" },
    rightColor: { type: "color", default: "#5555ff" },
    cursorSize: { type: "number", default: 0.02 },
    raycastLength: { type: "number", default: 10 },
    },

  init() {
    // Bind event handlers to the component instance
    this.handleTriggerDown = this.handleTriggerDown.bind(this);
    this.handleTriggerUp = this.handleTriggerUp.bind(this);
    this.handleGripDown = this.handleGripDown.bind(this);
    this.handleGripUp = this.handleGripUp.bind(this);
    
    // Controller elements created by this component
    this.controllerEls = [];
    
    // Set up controllers
    this.setupControllers();
    
    // Register raycaster cursor component if not already registered
    if (!AFRAME.components["raycaster-cursor"]) {
      this.registerRaycasterCursor();
    }
  },

  setupControllers() {
    const scene = this.el.sceneEl;
    
    // Create left controller if enabled
    if (this.data.leftEnabled) {
      const leftHand = this.createController("left", this.data.leftColor);
      this.controllerEls.push(leftHand);
      scene.appendChild(leftHand);
    }
    
    // Create right controller if enabled
    if (this.data.rightEnabled) {
      const rightHand = this.createController("right", this.data.rightColor);
      this.controllerEls.push(rightHand);
      scene.appendChild(rightHand);
    }
  },
  
  createController(hand, color) {
    // Create controller entity
    const controller = document.createElement("a-entity");
    controller.setAttribute("id", `${hand}Hand`);
    controller.setAttribute("oculus-touch-controls", `hand: ${hand}`);
    
    // Convert vector3 to string for raycaster
    const direction = '0 -0.4 -1';
    
    // Configure raycaster
    controller.setAttribute("raycaster", {
      showLine: true,
      lineColor: color,
      far: this.data.raycastLength,
      direction: direction,
      origin: "0 0 0",
      objects: ".interactive, .clickable",
    });
    
    // Add event listeners
    controller.addEventListener("triggerdown", this.handleTriggerDown);
    controller.addEventListener("triggerup", this.handleTriggerUp);
    controller.addEventListener("gripdown", this.handleGripDown);
    controller.addEventListener("gripup", this.handleGripUp);
    
    // Add cursor
    const cursor = document.createElement("a-sphere");
    cursor.setAttribute("radius", this.data.cursorSize);
    cursor.setAttribute("material", {
      color: color,
      shader: "flat",
      opacity: 0.8,
      transparent: true,
      depthTest: true
    });
    cursor.setAttribute("position", "0 0 0");  // Position will be set by cursor component
    cursor.setAttribute("raycaster-cursor", "");
    
    // Add to controller
    controller.appendChild(cursor);
    
    return controller;
  },

  handleTriggerDown(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;
    
    if (raycaster && raycaster.intersectedEls.length > 0) {
      const intersectedEl = raycaster.intersectedEls[0];
      intersectedEl.emit("triggerdown");
    }
  },

  handleTriggerUp(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;
    
    if (raycaster && raycaster.intersectedEls.length > 0) {
      raycaster.intersectedEls[0].emit("triggerup");
    }
  },

  handleGripDown(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;
    
    if (raycaster && raycaster.intersectedEls.length > 0) {
      raycaster.intersectedEls[0].emit("gripdown");
    }
  },

  handleGripUp(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;
    
    if (raycaster && raycaster.intersectedEls.length > 0) {
      raycaster.intersectedEls[0].emit("gripup");
    }
  },

  update(oldData) {
    // Handle changes that require controller recreation
    if (this.needsControllerRecreation(oldData)) {
      // Remove existing controllers
      this.remove();
      // Set up new controllers with updated configuration
      this.setupControllers();
    }
  },
  
  needsControllerRecreation(oldData) {
    return (
      oldData.leftEnabled !== undefined && oldData.leftEnabled !== this.data.leftEnabled ||
      oldData.rightEnabled !== undefined && oldData.rightEnabled !== this.data.rightEnabled ||
      oldData.leftColor !== undefined && oldData.leftColor !== this.data.leftColor ||
      oldData.rightColor !== undefined && oldData.rightColor !== this.data.rightColor ||
      oldData.cursorSize !== undefined && oldData.cursorSize !== this.data.cursorSize
    );
  },

  remove() {
    // Remove event listeners and controller elements
    this.controllerEls.forEach(controller => {
      controller.removeEventListener("triggerdown", this.handleTriggerDown);
      controller.removeEventListener("triggerup", this.handleTriggerUp);
      controller.removeEventListener("gripdown", this.handleGripDown);
      controller.removeEventListener("gripup", this.handleGripUp);
      
      // Remove from scene if it's still in the DOM
      if (controller.parentNode) {
        controller.parentNode.removeChild(controller);
      }
    });
    
    this.controllerEls = [];
  },

  registerRaycasterCursor() {
    /**
     * Raycaster Cursor Component
     * 
     * Makes a cursor entity follow the end of the raycaster line.
     * Used internally by the controllers component.
     */
    AFRAME.registerComponent("raycaster-cursor", {
      init: function () {
        this.cursorDirection = new THREE.Vector3();
        this.defaultDistance = 0;
        
        // Bind methods
        this.onLoaded = this.onLoaded.bind(this);
        this.onIntersection = this.onIntersection.bind(this);
        this.onIntersectionCleared = this.onIntersectionCleared.bind(this);
        
        // Add event listeners
        this.el.parentNode.addEventListener("loaded", this.onLoaded);
        this.el.parentNode.addEventListener("raycaster-intersection", this.onIntersection);
        this.el.parentNode.addEventListener("raycaster-intersection-cleared", this.onIntersectionCleared);
      },
      
      onLoaded: function() {
        // Get reference to parent's raycaster component
        if (this.el.parentNode.components.raycaster) {
          this.raycaster = this.el.parentNode.components.raycaster;
          
          // Store the default distance (set by controllers component)
          this.defaultDistance = this.raycaster.data.far;
          
          // Get the raycaster direction - handle both string and object formats
          const direction = this.raycaster.data.direction;
          if (typeof direction === 'string') {
            // Handle string format like "0 -0.4 -1"
            const dir = direction.split(' ').map(Number);
            this.cursorDirection.set(dir[0], dir[1], dir[2]).normalize();
          } else if (typeof direction === 'object') {
            // Handle object format like {x: 0, y: -0.4, z: -1}
            this.cursorDirection.set(
              direction.x !== undefined ? direction.x : 0, 
              direction.y !== undefined ? direction.y : 0, 
              direction.z !== undefined ? direction.z : -1
            ).normalize();
          } else {
            // Default fallback direction
            console.warn('Unexpected raycaster direction format, using default');
            this.cursorDirection.set(0, 0, -1).normalize();
          }
          
          // Set initial position at the end of the laser line
          this.updateCursorPosition(this.defaultDistance);
        } else {
          console.warn('Raycaster cursor could not find raycaster component');
        }
      },
      
      onIntersection: function(evt) {
        const intersection = evt.detail.intersections[0];
        if (intersection) {
          // Use distance directly to position cursor exactly at intersection
          const distance = intersection.distance;
          this.updateCursorPosition(distance);
        }
      },
      
      onIntersectionCleared: function() {
        // Return to default distance
        this.updateCursorPosition(this.defaultDistance);
      },
      
      updateCursorPosition: function(distance) {
        // Position cursor along the ray direction at exactly the specified distance
        const pos = this.cursorDirection.clone().multiplyScalar(distance);
        this.el.object3D.position.copy(pos);
      },

      tick: function () {
        if (!this.raycaster) return;
        
        // Check if raycaster has intersections
        if (this.raycaster.intersections && this.raycaster.intersections.length > 0) {
          const closestIntersection = this.raycaster.intersections[0];
          this.updateCursorPosition(closestIntersection.distance);
        } else {
          // If no intersections or we can't find them, use default
          this.updateCursorPosition(this.defaultDistance);
        }
      },
      
      remove: function() {
        // Clean up event listeners
        this.el.parentNode.removeEventListener("loaded", this.onLoaded);
        this.el.parentNode.removeEventListener("raycaster-intersection", this.onIntersection);
        this.el.parentNode.removeEventListener("raycaster-intersection-cleared", this.onIntersectionCleared);
      }
    });
  }
});