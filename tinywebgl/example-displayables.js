// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a.
// example-displayables.js - The subclass definitions here each describe different independent animation processes that you want to fire off each frame, by defining a display
// event and how to react to key and mouse input events.  Make one or two of your own subclasses, and fill them in with all your shape drawing calls and any extra key / mouse controls.

// Now go down to Example_Animation's display() function to see where the sample shapes you see drawn are coded, and a good place to begin filling in your own code.

Declare_Any_Class("Example_Camera",     // An example of a displayable object that our class Canvas_Manager can manage.  Adds both first-person and
  {
    'construct': function (context)     // third-person style camera matrix controls to the canvas.
    { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
      context.shared_scratchpad.graphics_state = new Graphics_State(translation(0, 0, -25), perspective(45, canvas.width / canvas.height, .1, 1000), 0);
      this.define_data_members({ graphics_state: context.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3(0, 5, 0), looking: false });
    },

    'display': function (time) {
      var bassFreqData = getBassFrequencyData();
      var bassAvgVolume = getAverageVolume(bassFreqData);
      var shiftPrecent = 0.20;
      this.graphics_state.camera_transform = mult(translation(0, 0, bassAvgVolume*shiftPrecent), this.graphics_state.camera_transform);
      this.graphics_state.shift = bassAvgVolume*shiftPrecent;
    }
  }, Animation);
