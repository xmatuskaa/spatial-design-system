import "../primitives/ar-button.js";
import "../components/position.js";
import "../components/menu.js";
const app = document.getElementById("app");
const scene = document.createElement("a-scene");

scene.setAttribute("vr-mode-ui", "enabled: true");
scene.setAttribute("loading-screen", "enabled: false");
scene.setAttribute("xr", "requestReferenceSpace: local");

scene.innerHTML = `
<!-- Simple environment for better orientation -->
<a-sky color="#ECECEC"></a-sky>
<a-plane position="0 0 0" rotation="-90 0 0" width="4" height="4" color="#7BC8A4" class="interactive"></a-plane>

<a-ar-button
    position="0 1.6 -3"
    size="medium"
    content="Click me"
    uppercase=true
    rounded=true
    outlined=true
    billboard
    class="interactive"
></a-ar-button>
<a-box 
    position="-1 1.2 -2" 
    rotation="0 45 0"
    width="0.4" 
    height="0.4" 
    depth="0.4"
    color="#4CC3D9"
    shadow
    class="interactive"
    animation="property: rotation; to: 0 405 0; dur: 2000; easing: linear; loop: true">
</a-box>

<a-entity circle position="3 2.6 -5.5" class="interactive">
  <a-entity material="color: #8A8A8A"></a-entity>
  <a-entity material="color: #018A6C"></a-entity>
  <a-entity material="color: #00C170"></a-entity>
  <a-entity material="color: #03FCC6"></a-entity>
</a-entity>

<!-- Controllers with raycasters and cursors for interaction -->
<a-entity id="leftHand" 
    oculus-touch-controls="hand: left" 
    raycaster="showLine: true; lineColor: red; far: 10; direction: 0 -0.4 -1; origin: 0 0 0; objects: .interactive">
    <!-- Sphere cursor for left hand -->
    <a-sphere
        radius="0.02"
        material="color: red; shader: flat; opacity: 0.8; metalness: 0.5; roughness: 0.5"
        position="0 -4 -10"
        raycaster-cursor>
    </a-sphere>
</a-entity>

<a-entity id="rightHand" 
    oculus-touch-controls="hand: right" 
    raycaster="showLine: true; lineColor: blue; far: 10; direction: 0 -0.4 -1; origin: 0 0 0; objects: .interactive">
    <!-- Sphere cursor for right hand -->
    <a-sphere
        radius="0.02"
        material="color: blue; shader: flat; opacity: 0.8; metalness: 0.5; roughness: 0.5"
        position="0 -4 -10"
        raycaster-cursor>
    </a-sphere>
</a-entity>

<!-- Simplified camera rig -->
<a-entity id="rig" position="0 0 0">
    <a-camera></a-camera>
</a-entity>
`;

// Register the raycaster-cursor component
AFRAME.registerComponent("raycaster-cursor", {
  init: function () {
    this.defaultPosition = new THREE.Vector3(0, -4, -10);
    this.currentPosition = new THREE.Vector3();

    this.el.parentNode.addEventListener("loaded", () => {
      this.raycaster = this.el.parentNode.components.raycaster;
    });

    this.el.parentNode.addEventListener("raycaster-intersection", (evt) => {
      const intersection = evt.detail.intersections[0];
      if (intersection) {
        const point = intersection.point;
        this.currentPosition.copy(point);
        this.el.parentNode.object3D.worldToLocal(this.currentPosition);
        this.el.object3D.position.copy(this.currentPosition);
      }
    });

    this.el.parentNode.addEventListener(
      "raycaster-intersection-cleared",
      () => {
        this.el.object3D.position.copy(this.defaultPosition);
      }
    );
  },

  tick: function () {
    // Only update position if we're not intersecting (position at end of ray)
    if (!this.el.parentNode.components.raycaster.intersectedEls.length) {
      this.el.object3D.position.copy(this.defaultPosition);
    }
  },
});

app.appendChild(scene);

const enterVRButton = document.createElement("button");
enterVRButton.textContent = "Enter VR";
enterVRButton.style.position = "fixed";
enterVRButton.style.bottom = "20px";
enterVRButton.style.left = "50%";
enterVRButton.style.transform = "translateX(-50%)";
enterVRButton.style.padding = "10px 20px";
enterVRButton.style.zIndex = "999";
enterVRButton.addEventListener("click", async () => {
  try {
    if (scene.is("vr-mode")) {
      await scene.exitVR();
    } else {
      await scene.enterVR();
    }
  } catch (error) {
    console.error("VR Error:", error);
    alert(
      "Failed to enter VR. Please make sure your headset is connected and try again."
    );
  }
});

app.appendChild(enterVRButton);
