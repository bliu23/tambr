/*
  This file should contain information for our music scene. We will be drawing shapes that we declare in tinywebgl/shapes.js and putting them together.
  If we want, we can create a separate file for each complex shape we draw and then put it all together in the 'display' section of this file.
*/


Declare_Any_Class("Music_Scene",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  {
    'construct': function (context) {
      this.shared_scratchpad = context.shared_scratchpad;
      this.shared_scratchpad.graphics_state.gouraud = true;
      context.shared_scratchpad.animate = true;

      this.graphics_state = context.shared_scratchpad.graphics_state;
      this.bodies = [];

      //Push the shapes we want to use here

      shapes_in_use["cube"] = new Cube();
      shapes_in_use["torus"] = new Torus(4, 4);
      shapes_in_use["cube_star"] = new Cube_Star();
      shapes_in_use["bird"] = new Bird();
      shapes_in_use["pyramid"] = new Pyramid();
      shapes_in_use["triangle3D"] = new Torus(3, 3);
      shapes_in_use["music_note"] = new Music_Note();

      //Generate the latitude and longitude bands for spheres. This allows us to call different shaped spheres based on treb/bass
      for (var i = sphereMinVal; i < 17; i++) {
        for (var j = sphereMinVal; j < 17; j++) {
          for (var k = 0; k < 1; k++) {
            var istring = "" + i;
            var jstring = "" + j;
            var kstring = "" + k;
            var sphereStr = "sphere" + istring + jstring + kstring;
            // console.log("string:", sphereString);
            shapes_in_use[sphereStr] = new Test_Sphere(i, j, .7 + k);
          }
        }
      }

      shapes_in_use_strings.push("star");
      shapes_in_use_strings.push("torus");
      this.shared_scratchpad = context.shared_scratchpad;

    },
    //Can add parameter for what shape we want!
    'get_shape'(shape) { return shapes_in_use[shape] },   //TODO: pass in value here

    'init_keys': function (controls)   // init_keys():  Define any extra keyboard shortcuts here
    {
      controls.add("ALT+g", this, function () { this.shared_scratchpad.graphics_state.gouraud ^= 1; });   // Make the keyboard toggle some
      controls.add("ALT+n", this, function () { this.shared_scratchpad.graphics_state.color_normals ^= 1; });   // GPU flags on and off.
      controls.add("p", this, function () {
        toggleAudio();
      })
    },

    'display': function (time) {
      var graphics_state = this.shared_scratchpad.graphics_state,
        model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.
      shaders_in_use["Default"].activate();

      // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
      // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
      graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

      freqData = getFrequencyData();
      avgVolume = getAverageVolume(freqData)
      var scaleFactor = avgVolume / 15;
      bassFreqData = getBassFrequencyData();
      bassAvgVolume = getAverageVolume(bassFreqData);
      trebleFreqData = getTrebleFrequencyData();
      trebleAvgVolume = getAverageVolume(trebleFreqData);


      var t = graphics_state.animation_time / 1000, light_orbit = [Math.cos(radians(t)), Math.sin(radians(t))];
      graphics_state.lights.push(new Light([-10, 10, -14, 0], Color(0, 0, 1, 0), 10 + scaleFactor * 5));
      graphics_state.lights.push(new Light(vec4(-3 + scaleFactor * light_orbit[0], scaleFactor * light_orbit[1], 2, 0), Color(.3, .6, .3, 1), 10 + scaleFactor));

      // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
      // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
      var darkBluePlastic = new Material(Color(0, .75, 1, 1), .5, .6, .8, 40), // Omit the final (string) parameter if you want no texture
        greyPlastic = new Material(Color(.5, .5, .5, 1), .4, .8, .4, 20),
        bluePlastic = new Material(Color(0, .8, 1, 1), .6, 1, 1, 10),
        textureMap = new Material(Color(1, .8, 1, 1), .6, 1, 1, 10, "text.png"),
        placeHolder = new Material(Color(0, 0, 0, 0), 0, 0, 0, 0, "Blank");
      backgroundPlastic = new Material(Color(0, 0, 0.4, 1), 0.3, 0.5, 0, 0, "Blank");

      /**********************************
      Start coding down here!!!!
      **********************************/                                     // From here on down it's just some example shapes drawn for you -- replace them with your own!

      if (graphics_state.shift > 0) {
        cameraShift += graphics_state.shift;
      }

      //    This has no collision because it is not drawn / called with advance/simulate
      model_transform = mat4();
      model_transform = mult(model_transform, translation(0, -2, 8));

      /******************************/
      /*  Generate Torus Background */
      /******************************/
      for (var i = 0; i < 800; i++) {
        var model_transform = mat4();
        var shapePos = -350 - 60 * i;
        if (shapePos > -cameraShift || shapePos < -1000 - cameraShift) {
          continue;
        }
        model_transform = mult(model_transform, translation(0, 0, shapePos));
        model_transform = mult(model_transform, scale(50 - 0.01 * i, 50 - 0.01 * i, 50 - 0.01 * i));
        shapes_in_use.torus.draw(graphics_state, model_transform, backgroundPlastic);
      }

      cubeRotDegreeX += trebleAvgVolume * 0.050;
      cubeRotDegreeY += trebleAvgVolume * 0.050;

      /******************************/
      /*  Create Cube On Pyramid    */
      /******************************/
      model_transform = mat4();
      model_transform = mult(model_transform, translation(0, 0, -cameraShift));
      model_transform = mult(model_transform, translation(8, -2.9, -3));
      model_transform = mult(model_transform, rotation(cubeRotDegreeX, [1, 0, 0]));
      model_transform = mult(model_transform, rotation(cubeRotDegreeY, [0, 1, 0]));
      shapes_in_use.cube.draw(graphics_state, mult(model_transform, scale(1, 1, 1)), bluePlastic);
      model_transform = mat4();
      model_transform = mult(model_transform, translation(0, 0, -cameraShift));
      model_transform = mult(model_transform, translation(8, -8, -3));
      shapes_in_use.pyramid.draw(graphics_state, mult(model_transform, scale(4, 4, 4)), bluePlastic);

      /******************************/
      /*  Sphere in 3d Triangle     */
      /******************************/
      var bass = getBassVol();
      var treble = getTrebleVol();
      istring = "" + bass;
      jstring = "" + treble;
      sphereString = "sphere" + istring + jstring + "0";
      var sphereScaleFactor = avgVolume / 400;
      sphereScaleFactor = 1.3 + sphereScaleFactor
      mat3Scale(sphereScaleFactor);
      
      //sphere1
      var sphereScale = 1
      var temp_transform = mat4();
      temp_transform = mult(temp_transform, translation(-2, 2, 0));
      model_transform = temp_transform;
      model_transform = mult(model_transform, translation(0, 0, -cameraShift));
      model_transform = mult(model_transform, translation(-8, 4, -5));
      model_transform = mult(model_transform, scale(mat3Scale(sphereScaleFactor * .8 + .2)));
      shapes_in_use[sphereString].draw(graphics_state, model_transform, darkBluePlastic);
      
      //sphere2
      model_transform = temp_transform;
      model_transform = mult(model_transform, translation(0, 0, -cameraShift));
      model_transform = mult(model_transform, translation(-8 - (2 * sphereScale * Math.cos(radians(60))), 4 - (2 * sphereScale * Math.sin(radians(60))), -5));
      model_transform = mult(model_transform, scale(mat3Scale(sphereScaleFactor * .8 + .2)));
      shapes_in_use[sphereString].draw(graphics_state, model_transform, darkBluePlastic);
      
      //sphere3
      model_transform = temp_transform;
      model_transform = mult(model_transform, translation(0, 0, -cameraShift));
      model_transform = mult(model_transform, translation(-8 + (2 * sphereScale * Math.cos(radians(60))), 4 - (2 * sphereScale * Math.sin(radians(60))), -5));
      model_transform = mult(model_transform, scale(mat3Scale(sphereScaleFactor * .8 + .2)))
      shapes_in_use[sphereString].draw(graphics_state, model_transform, darkBluePlastic);

      //3d triangle part
      model_transform = temp_transform;
      model_transform = mult(model_transform, translation(0, 0, -cameraShift));
      model_transform = mult(model_transform, translation(-8.1, 3, -5));
      model_transform = mult(model_transform, rotation(90, [0, 0, 1]));
      
      shapes_in_use.triangle3D.draw(graphics_state, mult(model_transform, scale(0.5, 0.5, 0.5)), bluePlastic);

      /******************************/
      /*  Equalizer (both parts)    */
      /******************************/
      for (var i = 0; i < 360 * 2; i += 6) {
        if (i < 360) {
          model_transform = mat4();
          model_transform = mult(model_transform, translation(0, 0, -cameraShift));
          model_transform = mult(model_transform, translation(4 * Math.cos(radians(i)), 4 * Math.sin(radians(i)), -25));
          model_transform = mult(model_transform, scale(1, 1, freqData[i] / 10));
          model_transform = mult(model_transform, rotation(i, [0, 0, 1]));
          shapes_in_use.pyramid.draw(graphics_state, model_transform, bluePlastic);
        } else {
          model_transform = mat4();
          model_transform = mult(model_transform, translation(0, 0, -cameraShift));
          model_transform = mult(model_transform, translation(6 * Math.cos(radians(i)), 6 * Math.sin(radians(i)), -25));
          model_transform = mult(model_transform, scale(0.4, 0.4, freqData[i] / 20));
          model_transform = mult(model_transform, rotation(i, [0, 0, 1]));
          shapes_in_use.triangle3D.draw(graphics_state, model_transform, bluePlastic);
        }
      }

      /******************************/
      /*  Bass and treble bars      */
      /******************************/
      for (var i = 0; i < 30; i++) {
        if (i < 15) {
          model_transform = mat4();
          model_transform = mult(model_transform, translation(0, 0, -cameraShift));
          model_transform = mult(model_transform, translation(10 + i, 28 - i, -70 + 0.35 * i));
          model_transform = mult(model_transform, translation(0, bassFreqData[i + 100] / 20, 0));
          model_transform = mult(model_transform, rotation(90, [0, 1, 0]));
          model_transform = mult(model_transform, scale(1, bassFreqData[i + 100] / 20, 1));
          model_transform = mult(model_transform, rotation(i, [0, 0, 1]));
          shapes_in_use.cube.draw(graphics_state, model_transform, bluePlastic);
        } else {
          model_transform = mat4();
          model_transform = mult(model_transform, translation(0, 0, -cameraShift));
          model_transform = mult(model_transform, translation(10 + i, 28 - i, -70 + 0.35 * i));
          model_transform = mult(model_transform, translation(0, trebleFreqData[i + 100] / 20, 0));
          model_transform = mult(model_transform, rotation(90, [0, 1, 0]));
          model_transform = mult(model_transform, scale(1, trebleFreqData[i + 100] / 20, 1));
          model_transform = mult(model_transform, rotation(i, [0, 0, 1]));
          shapes_in_use.cube.draw(graphics_state, model_transform, bluePlastic);
        }
      }

//    
      if (!audioElement.ended) {
        for (let b of this.bodies) {
          var m = mat4();
          m = mult(m, b.location_matrix);
          m[2][3] -= cameraShift;
          b.shape.draw(this.graphics_state, mult(m, scale(b.scale)), b.material); // Draw each shape at its current location 

          //TODO: temporary translation to keep it steadily flowing back and forth.
          // if(b.location_matrix[2][3] > 20) {
          //   b.location_matrix = mult(b.location_matrix, translation(0, 0, -40));
          // }
          b.advance(b, this.graphics_state.animation_delta_time);
        }
        this.simulate();    // This is an abstract class; call the subclass's version
      }
    }
  }, Animation);
