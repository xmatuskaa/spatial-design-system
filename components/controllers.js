import * as AFRAME from "aframe";

AFRAME.registerComponent("controllers", {
  init() {
    // Create controller entities
    this.setupControllers();

    // Register raycaster-cursor component
    this.registerRaycasterCursor();
  },

  setupControllers() {
    const scene = this.el.sceneEl;

    // Create left controller
    const leftHand = document.createElement("a-entity");
    leftHand.setAttribute("id", "leftHand");
    leftHand.setAttribute("oculus-touch-controls", "hand: left");
    leftHand.setAttribute("raycaster", {
      showLine: true,
      lineColor: "red",
      far: 10,
      direction: "0 -0.4 -1",
      origin: "0 0 0",
      objects: ".interactive, .clickable",
    });

    // Add controller event listeners
    leftHand.addEventListener("triggerdown", this.handleTriggerDown);
    leftHand.addEventListener("triggerup", this.handleTriggerUp);
    leftHand.addEventListener("gripdown", this.handleGripDown);
    leftHand.addEventListener("gripup", this.handleGripUp);

    // Add cursor to left hand
    const leftCursor = document.createElement("a-sphere");
    leftCursor.setAttribute("radius", "0.02");
    leftCursor.setAttribute("material", {
      color: "red",
      shader: "flat",
      opacity: 0.8,
    });
    leftCursor.setAttribute("position", "0 -4 -10");
    leftCursor.setAttribute("raycaster-cursor", "");
    leftHand.appendChild(leftCursor);

    // Create right controller
    const rightHand = document.createElement("a-entity");
    rightHand.setAttribute("id", "rightHand");
    rightHand.setAttribute("oculus-touch-controls", "hand: right");
    rightHand.setAttribute("raycaster", {
      showLine: true,
      lineColor: "blue",
      far: 10,
      direction: "0 -0.4 -1",
      origin: "0 0 0",
      objects: ".interactive, .clickable",
    });

    // Add controller event listeners
    rightHand.addEventListener("triggerdown", this.handleTriggerDown);
    rightHand.addEventListener("triggerup", this.handleTriggerUp);
    rightHand.addEventListener("gripdown", this.handleGripDown);
    rightHand.addEventListener("gripup", this.handleGripUp);

    // Add cursor to right hand
    const rightCursor = document.createElement("a-sphere");
    rightCursor.setAttribute("radius", "0.02");
    rightCursor.setAttribute("material", {
      color: "blue",
      shader: "flat",
      opacity: 0.8,
    });
    rightCursor.setAttribute("position", "0 -4 -10");
    rightCursor.setAttribute("raycaster-cursor", "");
    rightHand.appendChild(rightCursor);

    // Add controllers to scene
    scene.appendChild(leftHand);
    scene.appendChild(rightHand);
  },

  handleTriggerDown(evt) {
    console.log("Controller trigger down");
    const controller = evt.target;
    const raycaster = controller.components.raycaster;

    if (raycaster.intersectedEls.length > 0) {
      const intersectedEl = raycaster.intersectedEls[0];
      console.log("Triggering on element:", intersectedEl);
      intersectedEl.emit("triggerdown");
    }
  },

  handleTriggerUp(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;

    if (raycaster.intersectedEls.length > 0) {
      raycaster.intersectedEls[0].emit("triggerup");
    }
  },

  handleGripDown(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;

    if (raycaster.intersectedEls.length > 0) {
      raycaster.intersectedEls[0].emit("gripdown");
    }
  },

  handleGripUp(evt) {
    const controller = evt.target;
    const raycaster = controller.components.raycaster;

    if (raycaster.intersectedEls.length > 0) {
      raycaster.intersectedEls[0].emit("gripup");
    }
  },

  registerRaycasterCursor() {
    if (!AFRAME.components["raycaster-cursor"]) {
      AFRAME.registerComponent("raycaster-cursor", {
        init: function () {
          this.defaultPosition = new THREE.Vector3(0, -4, -10);
          this.currentPosition = new THREE.Vector3();

          this.el.parentNode.addEventListener("loaded", () => {
            this.raycaster = this.el.parentNode.components.raycaster;
          });

          this.el.parentNode.addEventListener(
            "raycaster-intersection",
            (evt) => {
              const intersection = evt.detail.intersections[0];
              if (intersection) {
                const point = intersection.point;
                this.currentPosition.copy(point);
                this.el.parentNode.object3D.worldToLocal(this.currentPosition);
                this.el.object3D.position.copy(this.currentPosition);
              }
            }
          );

          this.el.parentNode.addEventListener(
            "raycaster-intersection-cleared",
            () => {
              this.el.object3D.position.copy(this.defaultPosition);
            }
          );
        },

        tick: function () {
          if (!this.el.parentNode.components.raycaster.intersectedEls.length) {
            this.el.object3D.position.copy(this.defaultPosition);
          }
        },
      });
    }
  },
});
