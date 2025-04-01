import * as AFRAME from "aframe";

/**
 * Auto VR Component
 * 
 * Automatically detects VR headset and enters VR mode when appropriate.
 * Provides options for automatic entry, button creation, and fallback behavior.
 * 
 * @namespace spatial-design-system
 * @component auto-vr
 */
AFRAME.registerComponent("auto-vr", {
  schema: {
    autoEnter: { type: "boolean", default: true },
    createButton: { type: "boolean", default: true },
    buttonText: { type: "string", default: "Enter VR" },
    buttonExitText: { type: "string", default: "Exit VR" },
    buttonColor: { type: "string", default: "#ffffff" },
    buttonBgColor: { type: "string", default: "#000000" },
    buttonPosition: { type: "string", default: "bottom", oneOf: ["top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"] },
    buttonMargin: { type: "number", default: 20 },
    timeout: { type: "number", default: 5000 },
    debug: { type: "boolean", default: false }
  },

  init() {
    this.vrButton = null;
    this.isVrSupported = false;
    this.hasEntered = false;
    this.timeoutId = null;

    // Bind methods
    this.checkVRSupport = this.checkVRSupport.bind(this);
    this.enterVR = this.enterVR.bind(this);
    this.exitVR = this.exitVR.bind(this);
    this.onVRDisplayConnect = this.onVRDisplayConnect.bind(this);
    this.onVRDisplayDisconnect = this.onVRDisplayDisconnect.bind(this);
    this.onEnterVR = this.onEnterVR.bind(this);
    this.onExitVR = this.onExitVR.bind(this);

    // Add event listeners
    window.addEventListener('vrdisplayconnect', this.onVRDisplayConnect);
    window.addEventListener('vrdisplaydisconnect', this.onVRDisplayDisconnect);
    
    // Listen for A-Frame's VR mode changes
    this.el.addEventListener('enter-vr', this.onEnterVR);
    this.el.addEventListener('exit-vr', this.onExitVR);

    // Check for VR support
    this.checkVRSupport();

    // Create button if enabled
    if (this.data.createButton) {
      this.createVRButton();
    }

    if (this.data.debug) {
      console.log('Auto-VR initialized. VR supported:', this.isVrSupported);
    }
  },

  checkVRSupport() {
    // Check if VR is supported using different APIs
    if (navigator.xr) {
      // WebXR API
      navigator.xr.isSessionSupported('immersive-vr')
        .then(supported => {
          this.isVrSupported = supported;
          if (supported && this.data.autoEnter) {
            this.timeoutId = setTimeout(() => this.enterVR(), this.data.timeout);
          }
          if (this.data.debug) {
            console.log('WebXR VR supported:', supported);
          }
        })
        .catch(error => {
          console.error('Error checking WebXR support:', error);
        });
    } else if (navigator.getVRDisplays) {
      // WebVR API (deprecated)
      navigator.getVRDisplays()
        .then(displays => {
          this.isVrSupported = displays && displays.length > 0;
          if (this.isVrSupported && this.data.autoEnter) {
            this.timeoutId = setTimeout(() => this.enterVR(), this.data.timeout);
          }
          if (this.data.debug) {
            console.log('WebVR displays:', displays);
          }
        })
        .catch(error => {
          console.error('Error getting VR displays:', error);
        });
    } else {
      // No VR API available
      this.isVrSupported = false;
      if (this.data.debug) {
        console.log('No VR API detected');
      }
    }

    // Check A-Frame VR capabilities
    this.isVrSupported = this.isVrSupported || this.el.getAttribute('vr-mode-ui').enabled;
  },

  enterVR() {
    if (this.hasEntered) return;
    
    try {
      if (this.data.debug) {
        console.log('Attempting to enter VR mode');
      }
      
      // Use A-Frame's VR entry point
      this.el.enterVR();
    } catch (error) {
      console.error('Error entering VR:', error);
      // If failed, update button state
      if (this.vrButton) {
        this.vrButton.textContent = this.data.buttonText;
      }
    }
  },

  exitVR() {
    if (!this.hasEntered) return;
    
    try {
      if (this.data.debug) {
        console.log('Exiting VR mode');
      }
      
      // Use A-Frame's VR exit point
      this.el.exitVR();
    } catch (error) {
      console.error('Error exiting VR:', error);
    }
  },

  onVRDisplayConnect() {
    this.isVrSupported = true;
    if (this.data.debug) {
      console.log('VR display connected');
    }
    
    if (this.data.autoEnter && !this.hasEntered) {
      this.enterVR();
    }
    
    // Update button visibility
    if (this.vrButton) {
      this.vrButton.style.display = 'block';
    }
  },

  onVRDisplayDisconnect() {
    this.isVrSupported = false;
    if (this.data.debug) {
      console.log('VR display disconnected');
    }
    
    // Update button visibility
    if (this.vrButton) {
      this.vrButton.style.display = 'none';
    }
    
    // Exit VR if already in it
    if (this.hasEntered) {
      this.exitVR();
    }
  },

  onEnterVR() {
    this.hasEntered = true;
    if (this.data.debug) {
      console.log('Entered VR mode');
    }
    
    // Update button text
    if (this.vrButton) {
      this.vrButton.textContent = this.data.buttonExitText;
    }
  },

  onExitVR() {
    this.hasEntered = false;
    if (this.data.debug) {
      console.log('Exited VR mode');
    }
    
    // Update button text
    if (this.vrButton) {
      this.vrButton.textContent = this.data.buttonText;
    }
  },

  createVRButton() {
    // Create button element
    this.vrButton = document.createElement('button');
    this.vrButton.textContent = this.data.buttonText;
    this.vrButton.id = 'auto-vr-button';
    
    // Style the button
    Object.assign(this.vrButton.style, {
      position: 'fixed',
      padding: '10px 20px',
      zIndex: '9999',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '4px',
      color: this.data.buttonColor,
      backgroundColor: this.data.buttonBgColor,
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
      transition: 'background-color 0.3s, transform 0.1s',
      display: this.isVrSupported ? 'block' : 'none'
    });
    
    // Position the button
    this.positionButton();
    
    // Add button click handler
    this.vrButton.addEventListener('click', () => {
      if (this.hasEntered) {
        this.exitVR();
      } else {
        this.enterVR();
      }
    });
    
    // Add hover effect
    this.vrButton.addEventListener('mouseover', () => {
      this.vrButton.style.backgroundColor = this.lightenDarkenColor(this.data.buttonBgColor, 20);
    });
    
    this.vrButton.addEventListener('mouseout', () => {
      this.vrButton.style.backgroundColor = this.data.buttonBgColor;
    });
    
    // Add active effect
    this.vrButton.addEventListener('mousedown', () => {
      this.vrButton.style.transform = 'scale(0.95)';
    });
    
    this.vrButton.addEventListener('mouseup', () => {
      this.vrButton.style.transform = 'scale(1)';
    });
    
    // Add button to DOM
    document.body.appendChild(this.vrButton);
  },

  positionButton() {
    if (!this.vrButton) return;
    
    const margin = this.data.buttonMargin + 'px';
    
    switch (this.data.buttonPosition) {
      case 'top':
        Object.assign(this.vrButton.style, {
          top: margin,
          left: '50%',
          transform: 'translateX(-50%)'
        });
        break;
      case 'top-left':
        Object.assign(this.vrButton.style, {
          top: margin,
          left: margin
        });
        break;
      case 'top-right':
        Object.assign(this.vrButton.style, {
          top: margin,
          right: margin
        });
        break;
      case 'bottom-left':
        Object.assign(this.vrButton.style, {
          bottom: margin,
          left: margin
        });
        break;
      case 'bottom-right':
        Object.assign(this.vrButton.style, {
          bottom: margin,
          right: margin
        });
        break;
      case 'bottom':
      default:
        Object.assign(this.vrButton.style, {
          bottom: margin,
          left: '50%',
          transform: 'translateX(-50%)'
        });
        break;
    }
  },

  lightenDarkenColor(color, amount) {
    let usePound = false;
    
    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }
    
    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    
    r = Math.min(Math.max(0, r), 255);
    g = Math.min(Math.max(0, g), 255);
    b = Math.min(Math.max(0, b), 255);
    
    return (usePound ? '#' : '') + (
      (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0')
    );
  },

  update(oldData) {
    // Handle changes to button properties
    if (this.vrButton && oldData && (
      this.data.buttonColor !== oldData.buttonColor ||
      this.data.buttonBgColor !== oldData.buttonBgColor ||
      this.data.buttonPosition !== oldData.buttonPosition ||
      this.data.buttonMargin !== oldData.buttonMargin
    )) {
      // Update button styles
      this.vrButton.style.color = this.data.buttonColor;
      this.vrButton.style.backgroundColor = this.data.buttonBgColor;
      
      // Update button position
      this.positionButton();
    }
    
    // Handle changes to button text
    if (this.vrButton) {
      if (this.hasEntered) {
        if (this.data.buttonExitText !== oldData.buttonExitText) {
          this.vrButton.textContent = this.data.buttonExitText;
        }
      } else {
        if (this.data.buttonText !== oldData.buttonText) {
          this.vrButton.textContent = this.data.buttonText;
        }
      }
    }
    
    // Handle changes to button visibility
    if (this.vrButton && oldData && this.data.createButton !== oldData.createButton) {
      this.vrButton.style.display = this.data.createButton ? (this.isVrSupported ? 'block' : 'none') : 'none';
    }
  },

  remove() {
    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    // Remove event listeners
    window.removeEventListener('vrdisplayconnect', this.onVRDisplayConnect);
    window.removeEventListener('vrdisplaydisconnect', this.onVRDisplayDisconnect);
    this.el.removeEventListener('enter-vr', this.onEnterVR);
    this.el.removeEventListener('exit-vr', this.onExitVR);
    
    // Remove button
    if (this.vrButton && this.vrButton.parentNode) {
      this.vrButton.parentNode.removeChild(this.vrButton);
      this.vrButton = null;
    }
  }
});