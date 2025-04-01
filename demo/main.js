import "../components/controller-attach.js"; // Import the controller-attach component
import "../primitives/ar-button.js";
import "../components/position.js";
import "../components/controllers.js";  // Import your controllers component
import "../components/autoVr.js";
import "../components/vrinteractive.js";


const app = document.getElementById("app");
const scene = document.createElement("a-scene");

scene.setAttribute("vr-mode-ui", "enabled: true");
scene.setAttribute("loading-screen", "enabled: false");
scene.setAttribute("xr", "requestReferenceSpace: local");

scene.setAttribute("auto-vr", {
  autoEnter: true,
});

scene.innerHTML = `
<!-- Simple environment for better orientation -->
<a-sky color="#ECECEC"></a-sky>
<a-plane position="0 0 0" rotation="-90 0 0" width="20" height="20" color="#7BC8A4" class="interactive"></a-plane>

<!-- Create controllers entity -->
<a-entity controllers></a-entity>


<!-- Panel attached to right controller -->
<a-entity
    id="rightControllerPanel"
    geometry="primitive: plane; width: 0.25; height: 0.15"
    material="color: #2196F3; opacity: 0.8"
    controller-attach="hand: right; offset: 0.15 0.05 -0.1; rotation: 0 -30 0; lookAtCamera: true"
    class="vrinteractive"
>
    <a-text value="Controls" align="center" position="0 0.05 0.001" scale="0.1 0.1 0.1" color="white"></a-text>
    
    <!-- Small control buttons -->
    <a-entity position="-0.08 -0.02 0.001" scale="0.5 0.5 0.5">
        <a-entity
            geometry="primitive: circle; radius: 0.05"
            material="color: #FF5722"
            class="clickable"
        ></a-entity>
    </a-entity>
    
    <a-entity position="0 -0.02 0.001" scale="0.5 0.5 0.5">
        <a-entity
            geometry="primitive: circle; radius: 0.05"
            material="color: #4CAF50"
            class="clickable"
        ></a-entity>
    </a-entity>
    
    <a-entity position="0.08 -0.02 0.001" scale="0.5 0.5 0.5">
        <a-entity
            geometry="primitive: circle; radius: 0.05"
            material="color: #9C27B0"
            class="clickable"
        ></a-entity>
    </a-entity>
</a-entity>

<!-- Test scene objects to interact with -->
<a-box position="-1 1 -3" width="0.5" height="0.5" depth="0.5" color="#F44336" class="vrinteractive"></a-box>
<a-sphere position="0 1.25 -3" radius="0.5" color="#2196F3" class="vrinteractive"></a-sphere>
<a-cylinder position="1 1 -3" radius="0.5" height="1" color="#4CAF50" vrinteractive></a-cylinder>

<!-- Camera rig -->
<a-entity id="rig" position="0 0 0">
  <a-camera id="camera" wasd-controls look-controls></a-camera>
</a-entity>
`;

app.appendChild(scene);

// Set up interaction listeners
scene.addEventListener('loaded', function() {
  console.log('Scene loaded, setting up interactions');
  
  // Left controller menu button interaction
  const leftControllerUI = document.getElementById('leftControllerUI');
  if (leftControllerUI) {
    leftControllerUI.addEventListener('click', function() {
      console.log('Left controller UI clicked');
      // Toggle the visibility of the left controller tool
      const leftTool = document.getElementById('leftControllerTool');
      if (leftTool) {
        leftTool.setAttribute('visible', !leftTool.getAttribute('visible'));
      }
    });
  }
  
  // Right controller panel buttons
  const rightPanel = document.getElementById('rightControllerPanel');
  if (rightPanel) {
    const buttons = rightPanel.querySelectorAll('.clickable');
    buttons.forEach((button, index) => {
      button.addEventListener('click', function() {
        console.log(`Right panel button ${index} clicked`);
        
        // Change the color of the indicator light based on the button clicked
        const indicatorLight = document.getElementById('rightControllerLight');
        if (indicatorLight) {
          // Get the button's color
          const buttonColor = button.getAttribute('material').color;
          // Apply it to the indicator light
          indicatorLight.setAttribute('material', {
            color: buttonColor,
            emissive: buttonColor,
            emissiveIntensity: 0.5
          });
        }
      });
    });
  }
});
