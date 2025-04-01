import * as AFRAME from "aframe";

/**
 * Controller Attach Component
 * 
 * Attaches an entity to a VR controller with configurable offset and orientation.
 * The entity will follow the controller's position and rotation.
 * Compatible with the custom controllers component from controllers.js.
 * 
 * @namespace spatial-design-system
 * @component controller-attach
 */
AFRAME.registerComponent("controller-attach", {
  schema: {
    hand: { type: "string", default: "right", oneOf: ["left", "right"] },
    offset: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    rotation: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    lookAtCamera: { type: "boolean", default: false },
    forwardEvents: { type: "boolean", default: true }
  },

  init() {
    this.controllerEl = null;
    this.cameraEl = document.querySelector("[camera]");
    
    // Create vectors for position and rotation calculations
    this.worldPosition = new THREE.Vector3();
    this.controllerPosition = new THREE.Vector3();
    this.cameraPosition = new THREE.Vector3();
    
    // Bind methods to maintain context
    this.findController = this.findController.bind(this);
    
    // Find the appropriate controller
    this.findController();
    
    // Set up a listener for when controllers might be created after this component initializes
    this.el.sceneEl.addEventListener("loaded", this.findController);
    
    // Add listener for controller connections
    this.el.sceneEl.addEventListener("controllerconnected", this.findController);
    
    // Add event listeners if forwarding is enabled
    if (this.data.forwardEvents) {
      this.addEventListeners();
    }
  },

  findController() {
    // Find controller by ID based on the custom controllers component
    // Controllers are expected to have IDs "leftHand" and "rightHand"
    const controllerId = this.data.hand === "left" ? "leftHand" : "rightHand";
    this.controllerEl = document.getElementById(controllerId);
    
    if (!this.controllerEl) {
      console.warn(`Controller-attach: ${this.data.hand} controller (ID: ${controllerId}) not found. Will retry...`);
      // Retry after a short delay to allow controllers to initialize
      this.findControllerTimeout = setTimeout(() => this.findController(), 500);
    } else {
      if (this.data.forwardEvents) {
        this.addEventListeners();
      }
    }
  },

  tick() {
    // Skip if no controller is found
    if (!this.controllerEl || !this.controllerEl.isConnected) {
      return;
    }
    
    // Update the attached element's position based on controller position
    this.updatePosition();
    
    // Update the attached element's rotation based on controller rotation and settings
    this.updateRotation();
  },

  updatePosition() {
    // Get world position of the controller
    this.controllerEl.object3D.getWorldPosition(this.controllerPosition);
    
    // Apply the offset in the controller's local space
    const offsetVec = new THREE.Vector3(
      this.data.offset.x,
      this.data.offset.y,
      this.data.offset.z
    );
    
    // Transform the offset vector to world coordinates based on controller's orientation
    const quaternion = new THREE.Quaternion();
    this.controllerEl.object3D.getWorldQuaternion(quaternion);
    offsetVec.applyQuaternion(quaternion);
    
    // Calculate final position
    this.worldPosition.copy(this.controllerPosition).add(offsetVec);
    
    // Set the position
    this.el.object3D.position.copy(this.worldPosition);
  },

  updateRotation() {
    if (this.data.lookAtCamera && this.cameraEl) {
      try {
        // Get camera position
        this.cameraEl.object3D.getWorldPosition(this.cameraPosition);
        
        // Make the entity look at the camera
        this.el.object3D.lookAt(this.cameraPosition);
        
        // Apply additional rotation specified in the component data
        this.el.object3D.rotation.x += THREE.MathUtils.degToRad(this.data.rotation.x);
        this.el.object3D.rotation.y += THREE.MathUtils.degToRad(this.data.rotation.y);
        this.el.object3D.rotation.z += THREE.MathUtils.degToRad(this.data.rotation.z);
      } catch (error) {
        console.error("Error updating rotation with lookAtCamera", error);
      }
    } else {
      try {
        // Copy the controller's rotation
        const controllerRotation = new THREE.Euler();
        this.controllerEl.object3D.rotation.reorder('YXZ'); // Ensure consistent rotation order
        controllerRotation.copy(this.controllerEl.object3D.rotation);
        
        // Apply additional rotation
        controllerRotation.x += THREE.MathUtils.degToRad(this.data.rotation.x);
        controllerRotation.y += THREE.MathUtils.degToRad(this.data.rotation.y);
        controllerRotation.z += THREE.MathUtils.degToRad(this.data.rotation.z);
        
        // Set the rotation
        this.el.object3D.rotation.copy(controllerRotation);
      } catch (error) {
        console.error("Error updating rotation", error);
      }
    }
  },

  // Make the component propagate events from the controller to the attached object
  addEventListeners() {
    if (!this.controllerEl) return;
    
    // List of events to forward
    const events = [
      'click', 'triggerdown', 'triggerup', 'gripdown', 'gripup'
    ];
    
    // Store event handlers to enable removal later
    this.eventHandlers = {};
    
    events.forEach(eventName => {
      const forwardEvent = (evt) => {
        this.el.emit(eventName, evt.detail, false);
      };
      
      // Store the listener function so we can remove it later
      this.eventHandlers[eventName] = forwardEvent;
      this.controllerEl.addEventListener(eventName, forwardEvent);
    });
  },
  
  removeEventListeners() {
    if (!this.controllerEl || !this.eventHandlers) return;
    
    // Remove all event listeners
    Object.entries(this.eventHandlers).forEach(([eventName, handler]) => {
      this.controllerEl.removeEventListener(eventName, handler);
    });
    
    this.eventHandlers = {};
  },
  
  update(oldData) {
    // Handle changes to forwardEvents
    if (oldData.forwardEvents !== undefined && 
        this.data.forwardEvents !== oldData.forwardEvents) {
      if (this.data.forwardEvents) {
        this.addEventListeners();
      } else {
        this.removeEventListeners();
      }
    }
  },
  
  remove() {
    // Clean up event listeners
    this.removeEventListeners();
    
    // Clear timeouts
    if (this.findControllerTimeout) {
      clearTimeout(this.findControllerTimeout);
    }
    
    // Remove scene event listeners
    this.el.sceneEl.removeEventListener("loaded", this.findController);
    this.el.sceneEl.removeEventListener("controllerconnected", this.findController);
  }
});