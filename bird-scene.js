Declare_Any_Class("Bird_Scene",  // An example of a displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  {
    'construct': function (context) {
      this.graphics_state = context.shared_scratchpad.graphics_state;

      shapes_in_use["box"] = new Cube();
      shapes_in_use["ball"] = new Sphere(10, 10);

      shapes_in_use["pyramid"] = new Pyramid();
      shapes_in_use["bird_sphere"] = new Subdivision_Sphere(1);
      shapes_in_use["bird_sphere2"] = new Subdivision_Sphere(2);
      shapes_in_use["bird_wing"] = new Bird_Wing();
      shapes_in_use["box"] = new Cube();

      this.shared_scratchpad = context.shared_scratchpad;
    },
    'display': function (time) {
      var graphics_state = this.graphics_state;
      if (graphics_state.shift > 0) {
            birdShift += graphics_state.shift;
      }
      var model_transform = mat4();
      model_transform = mult(model_transform, translation(0, 0, -birdShift));
      model_transform = mult(model_transform, translation(-8, -5, 0));
      model_transform = mult(model_transform, rotation(15, 0, 1, 0));
      model_transform = mult(model_transform, translation(0, .4 + -Math.sin(this.graphics_state.animation_time / 580), 0))


      shaders_in_use["Default"].activate();
      this.graphics_state.lights = [new Light(vec4(3, 2, 1, 1), Color(1, 0, 0, 1), 100000000),
      new Light(vec4(-1, -2, -3-birdShift, 1), Color(0, 1, 0, 1), 100000000)];
      var bluePlastic = new Material(Color(0, .8, 1, 1), .4, .8, .8, 10);


      //head
      var object_transform = model_transform;
      object_transform = mult(object_transform, rotation(90, 1, 0, 0))
      shapes_in_use.pyramid.draw(this.graphics_state, mult(object_transform, scale(.3, .7, .2)), bluePlastic);
      object_transform = model_transform;
      object_transform = mult(object_transform, translation(0, .2, -.5))
      shapes_in_use.bird_sphere.draw(this.graphics_state, mult(object_transform, scale(.8, .8, .8)), bluePlastic);

      //body
      object_transform = mult(object_transform, translation(0, -1.6, -1.5))
      object_transform = mult(object_transform, rotation(40, 1, 0, 0))
      shapes_in_use.bird_sphere2.draw(this.graphics_state, mult(object_transform, scale(.9, 2, 1)), bluePlastic);



      object_transform = model_transform;
      object_transform = mult(object_transform, translation(.2, .35, 0));
      shapes_in_use.bird_sphere.draw(this.graphics_state, mult(object_transform, scale(.07, .07, .07)), bluePlastic);


      object_transform = model_transform;
      object_transform = mult(object_transform, translation(-.2, .35, 0));
      shapes_in_use.bird_sphere.draw(this.graphics_state, mult(object_transform, scale(.07, .07, .07)), bluePlastic);

      //wings (left, right)
      var rotateValue = (this.graphics_state.animation_time / 100) % 30 + 75;

      object_transform = model_transform;
      object_transform = mult(object_transform, translation(-.7, -.8, -1.9))

      object_transform = mult(object_transform, rotation(90, 0, 0, 1));
      object_transform = mult(object_transform, rotation(-trebleAvgVolume + 45, 0, 0, 1));
      shapes_in_use.bird_wing.draw(this.graphics_state, mult(object_transform, scale(.3, 1, .5)), bluePlastic);

      object_transform = model_transform;
      object_transform = mult(object_transform, translation(.7, -.8, -1.7))
      object_transform = mult(object_transform, rotation(180, 0, 1, 0))
      object_transform = mult(object_transform, rotation(90, 0, 0, 1));

      object_transform = mult(object_transform, rotation(-bassAvgVolume * 2.5 + 45, 0, 0, 1));
      shapes_in_use.bird_wing.draw(this.graphics_state, mult(object_transform, scale(.3, 1, .5)), bluePlastic);

      //feet (right, left)
      object_transform = model_transform;
      object_transform = mult(object_transform, translation(.3, -2.7, -2.4));
      object_transform = mult(object_transform, rotation(30, 0, 0, 1))
      object_transform = mult(object_transform, rotation(40, 1, 0, 0))
      shapes_in_use.cube.draw(this.graphics_state, mult(object_transform, scale(.15, .35, .15)), bluePlastic);


      object_transform = model_transform;
      object_transform = mult(object_transform, translation(-.3, -2.7, -2.4));
      object_transform = mult(object_transform, rotation(-30, 0, 0, 1))
      object_transform = mult(object_transform, rotation(40, 1, 0, 0))
      shapes_in_use.cube.draw(this.graphics_state, mult(object_transform, scale(.15, .35, .15)), bluePlastic);


      //tail
      object_transform = model_transform;
      object_transform = mult(object_transform, translation(0, -1.9, -3.2));
      // object_transform = mult(object_transform, rotation(-45, 0, 1, 0))
      object_transform = mult(object_transform, rotation(-20, 1, 0, 0))
      shapes_in_use.cube.draw(this.graphics_state, mult(object_transform, scale(.5, .2, 1.1)), bluePlastic);


    }
  }, Animation);


