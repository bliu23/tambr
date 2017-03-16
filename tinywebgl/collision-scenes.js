Declare_Any_Class("Body",
  //TODO: use the parameters to properly declare the starting location and starting velocity of our shapes.
  {
    //Parameters: shape, scale factor (mat3), location matrix (mat4), linear velocity (number), angular velocity (number), spin axis (mat3), material (Material), isMainShape (boolean, optional)
    'construct'(s, sc, loc, lin_v, ang_v, ax, mat, main = false, sh = "") {
      this.define_data_members({
        shape: s,
        scale: sc,
        location_matrix: loc,  //initial location
        linear_velocity: [0, 0, lin_v],                                 //velocity in which direction is goes
        angular_velocity: ang_v,
        spin_axis: ax,                        //TODO: Change lin/ang velocity
        material: mat,
        isMainShape: main,
        shapeString: sh
      })

    },

    'advance'(b, time_amount)   // Do one timestep.
    {
      var delta = translation(scale_vec(time_amount, b.linear_velocity));  // Move proportionally to real time.
      b.location_matrix = mult(delta, b.location_matrix);                    // Apply translation velocity - pre-multiply to keep translations together

      delta = rotation(time_amount * b.angular_velocity, b.spin_axis);       // Move proportionally to real time.
      b.location_matrix = mult(b.location_matrix, delta);                    // Apply angular velocity - post-multiply to keep rotations together 
    },
    'check_if_colliding'(b, a_inv, shape)   // Collision detection function
    {
      if (this == b) return false;        // Nothing collides with itself
      var T = mult(a_inv, mult(b.location_matrix, scale(b.scale)));  // Convert sphere b to a coordinate frame where a is a unit sphere
      for (let p of shape.positions)                                      // For each vertex in that b,
      {
        var Tp = mult_vec(T, p.concat(1)).slice(0, 3);                    // Apply a_inv*b coordinate frame shift
        if (dot(Tp, Tp) < 1.2) return true;     // Check if in that coordinate frame it penetrates the unit sphere at the origin.     
      }
      return false;
    }
  });


Declare_Any_Class("Object_Collision_Scene",    // Scenario 2: Detect when the flying objects collide with one another, coloring them red.    
  {
    'simulate'(time) {
      //TODO: Declare our shapes here, and we can pass in parameters into new Body(param1, etc) declaration.

      var scaleFactor;
      if (scaleFactor == null) {
        scaleFactor = 1;
      }

      var location_matrix = mat4();

      if (mainShapeDrawn === false) {
        mainShapeDrawn = true;
        location_matrix = mat4();
        var main_mat = new Material(Color(1, 1, 1, 1), .6, .9, .9, 40);
        this.bodies.push(new Body(this.get_shape("cube_star"), [.4, .4, .4], mult(location_matrix, translation(0, 0, 10)), 0, 0.008, [0, 0, 1], main_mat, true));
      }
      if (this.bodies[0].isMainShape == true) {
        var scaleFactor = avgVolume / 500;
        scaleFactor = .3 + scaleFactor
        this.bodies[0].scale = mat3Scale(scaleFactor);
      }

      if (parseInt(this.graphics_state.animation_time) > beatInterval) {
        canDrawNewBeat = true;
        beatInterval += initialBeatInterval;
      }

      //Draw beat shape at a particular interval...
      if (canDrawNewBeat) {
        canDrawNewBeat = false;
        // beatInterval += bpm * 5;
        drawBeatShape(this);
      }

      //Handle collision here
      if (isHandlingCollision) {
        //this whole thing takes totalCollisionTime ms.
        var collide_time_elapsed = this.graphics_state.animation_time - handle_start_time;          //elapsed time

        //Shrink object on contact
        if (collide_time_elapsed < 100) {
          this.bodies[collisionBodyNum].scale = mat3Scale(collisionBodySize / collide_time_elapsed * 10)
        }
        //Once done shrinking, now we can create our new object
        else if (isShrinking) {
          isShrinking = false;
          var tempLoc = this.bodies[collisionBodyNum].location_matrix;
          var tempX = tempLoc[0][3] + .5;
          var tempY = tempLoc[1][3] + .2;
          var tempZ = tempLoc[2][3];
          tempLoc = mult(mat4(), translation(tempX, tempY, tempZ))
          this.bodies.splice(collisionBodyNum, 1);
          var whiteMaterial = new Material(Color(1, 1, 1, 1), 1, 1, 1, 40)
          this.bodies.push(new Body(this.get_shape("torus"), mat3Scale(0), tempLoc, 0, 0, [0, 0, 1], whiteMaterial))
          collisionBodyNum = this.bodies.length - 1;
        }

        //Now, create the new object and grow it
        if (!isShrinking) {
          if (this.bodies[collisionBodyNum]) {
            var scaleSize = collide_time_elapsed / 500;

            this.bodies[collisionBodyNum].scale = mat3Scale(scaleSize);
          }
          //End collision handling after 2 seconds (or however long we choose)
          if (collide_time_elapsed > totalCollisionTime) {
            this.bodies.splice(collisionBodyNum, 1);
            isHandlingCollision = false;
            beatShapeDrawn = false;
          }
        }


      }

      if (!this.collider)
        this.collider = new Subdivision_Sphere(1);      // The collision shape should be simple

      //Change let b_num of this.bodies --> b of this.bodies to delete element from array
      for (let b_num in this.bodies) {
        b = this.bodies[b_num];
        //TODO: Right now this just deletes shapes (and then it gets repopulated up above in the while loop) when they're out of sight.
        var b_zPosition = b.location_matrix[2][3];
        var zPosMax = 20;
        var isOutOfView = b_zPosition > zPosMax;
        if (isOutOfView) {
          //This deletes the element from array, so the above while loop will create a new random shape.

          //TODO: Fix a bug that is due to splice race condition
          // this.bodies.splice(b_num, 1);

          //Can also just set b.location_matrix[2][3] to some z value further back to just recycle the shape...  
          //           b.location_matrix[2][3] = -15;
          continue;
        }

        var b_inv = inverse(mult(b.location_matrix, scale(b.scale)));               // Cache b's final transform
        var center = mult_vec(b.location_matrix, vec4(0, 0, 0, 1)).slice(0, 3);        // Center of the body
        // b.linear_velocity = subtract( b.linear_velocity, scale_vec( .0008, center ) );    // Apply a small centripetal force to everything
        // b.material = new Material( Color( 1,1,1,1 ), .1, 1, 1, 40 );                      // Default color: white

        //Loop through bodies and check if colliding. If colliding, TODO: handle collisions
        for (let c of this.bodies)                                      // Collision process starts here
          if (b.check_if_colliding(c, b_inv, this.collider)) {         // Send the two bodies and the collision shape
            if (b.isMainShape) {

            }
            //handle collision here for the non-main shape
            else {
              // b.material = new Material(Color(1, 0, 0, 1), .1, 1, 1, 40);
              newmat = new Material(Color(1, 1, 1, 1), .4, .9, .9, 40);

              //not handling yet
              if (!isHandlingCollision) {
                isHandlingCollision = true;
                handle_start_time = this.graphics_state.animation_time;
                collisionBodyNum = b_num;
                collisionBodySize = this.bodies[b_num].scale[0];
                isShrinking = true;

              }
            }

          }
      }
    }
  }, Music_Scene);


