Declare_Any_Class("Music_Scene",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  {
    'construct': function (context) {
    this.shared_scratchpad = context.shared_scratchpad;

      shapes_in_use.triangle = new Triangle();                  // At the beginning of our program, instantiate all shapes we plan to use,
      shapes_in_use.strip = new Square();                   // each with only one instance in the graphics card's memory.
      shapes_in_use.bad_tetrahedron = new Tetrahedron(false);      // For example we'll only create one "cube" blueprint in the GPU, but we'll re-use
      shapes_in_use.tetrahedron = new Tetrahedron(true);      // it many times per call to display to get multiple cubes in the scene.
      shapes_in_use.windmill = new Windmill(10);

      shapes_in_use.triangle_flat = Triangle.prototype.auto_flat_shaded_version();
      shapes_in_use.strip_flat = Square.prototype.auto_flat_shaded_version();
      shapes_in_use.bad_tetrahedron_flat = Tetrahedron.prototype.auto_flat_shaded_version(false);
      shapes_in_use.tetrahedron_flat = Tetrahedron.prototype.auto_flat_shaded_version(true);
      shapes_in_use.windmill_flat = Windmill.prototype.auto_flat_shaded_version(10);
    },
    'init_keys': function (controls)   // init_keys():  Define any extra keyboard shortcuts here
    {
      controls.add("ALT+g", this, function () { this.shared_scratchpad.graphics_state.gouraud ^= 1; });   // Make the keyboard toggle some
      controls.add("ALT+n", this, function () { this.shared_scratchpad.graphics_state.color_normals ^= 1; });   // GPU flags on and off.
      controls.add("ALT+a", this, function () { this.shared_scratchpad.animate ^= 1; });
    },
    'update_strings': function (user_interface_string_manager)       // Strings that this displayable object (Animation) contributes to the UI:
    {
      user_interface_string_manager.string_map["time"] = "Animation Time: " + Math.round(this.shared_scratchpad.graphics_state.animation_time) / 1000 + "s";
      user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off");
    },
    'display': function (time) {
      var graphics_state = this.shared_scratchpad.graphics_state,
        model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.
      shaders_in_use["Default"].activate();

      // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
      // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
      graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

      var t = graphics_state.animation_time / 1000, light_orbit = [Math.cos(t), Math.sin(t)];
      graphics_state.lights.push(new Light(vec4(30 * light_orbit[0], 30 * light_orbit[1], 34 * light_orbit[0], 1), Color(0, .4, 0, 1), 100000));
      graphics_state.lights.push(new Light(vec4(-10 * light_orbit[0], -20 * light_orbit[1], -14 * light_orbit[0], 0), Color(1, 1, .3, 1), 100 * Math.cos(t / 10)));

      // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
      // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
      var purplePlastic = new Material(Color(.9, .5, .9, 1), .4, .4, .8, 40), // Omit the final (string) parameter if you want no texture
        greyPlastic = new Material(Color(.5, .5, .5, 1), .4, .8, .4, 20),
        placeHolder = new Material(Color(0, 0, 0, 0), 0, 0, 0, 0, "Blank");

      /**********************************
      Start coding down here!!!!
      **********************************/                                     // From here on down it's just some example shapes drawn for you -- replace them with your own!

      model_transform = mult(model_transform, translation(0, 5, 0));
      shapes_in_use.triangle.draw(graphics_state, model_transform, purplePlastic);

      model_transform = mult(model_transform, translation(0, -2, 0));
      shapes_in_use.strip.draw(graphics_state, model_transform, greyPlastic);

      model_transform = mult(model_transform, translation(0, -2, 0));
      shapes_in_use.tetrahedron.draw(graphics_state, model_transform, purplePlastic);

      model_transform = mult(model_transform, translation(0, -2, 0));
      shapes_in_use.bad_tetrahedron.draw(graphics_state, model_transform, greyPlastic);

      model_transform = mult(model_transform, translation(0, -2, 0));
      shapes_in_use.windmill.draw(graphics_state, mult(model_transform, rotation(.7 * graphics_state.animation_time, .1, .8, .1)), purplePlastic);

      shaders_in_use["Demo_Shader"].activate();
      model_transform = mult(model_transform, translation(0, -2, 0));
      shapes_in_use.windmill.draw(graphics_state, model_transform, placeHolder);
    }
  }, Animation);