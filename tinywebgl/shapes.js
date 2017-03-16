// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a.
// example_shapes.js is where you can define a number of objects that inherit from class Shape.  All Shapes have certain arrays.  These each manage either
// the shape's 3D vertex positions, 3D vertex normal vectors, 2D texture coordinates, or any other per-vertex quantity.  All subclasses of Shape inherit
// instantiation, any Shape subclass populates these lists in their own way, so we can use GL calls -- special kernel functions to copy each of the lists
// one-to-one into new buffers in the graphics card's memory.

// 1.  Some example simple primitives -- really easy shapes are at the beginning of the list just to demonstrate how Shape is used. Mimic these when
//                        making your own Shapes.  You'll find it to be much easier to work with than raw GL vertex arrays managed on your own.
//     Tutorial shapes:   Triangle, Square, Tetrahedron, Windmill,
//
// 2.  More difficult primitives*:  Surface_of_Revolution, Regular_2D_Polygon, Cylindrical_Tube, Cone_Tip, Torus, Sphere, Subdivision_Sphere,
//                                 OBJ file (loaded using the library webgl-obj-loader.js )
//        *I'll give out the code for these later.
// 3.  Example compound shapes*:    Closed_Cone, Capped_Cylinder, Cube, Axis_Arrows, Text_Line
//        *I'll give out the code for these later.  Except for Text_Line, which you can already have below.
// *******************************************************

// 1.  TUTORIAL SHAPES:     ------------------------------------------------------------------------------------------------------------------------------


// *********** SQUARE ***********
Declare_Any_Class("Square",    // A square, demonstrating shared vertices.  On any planar surface, the interior edges don't make any important seams.
  {
    'populate': function ()      // In these cases there's no reason not to re-use values of the common vertices between triangles.  This makes all the
    {                         // vertex arrays (position, normals, etc) smaller and more cache friendly.
      this.positions.push(vec3(-1, -1, 0), vec3(1, -1, 0), vec3(-1, 1, 0), vec3(1, 1, 0)); // Specify the 4 vertices -- the point cloud that our Square needs.
      this.normals.push(vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1));     // ...
      this.texture_coords.push(vec2(0, 0), vec2(1, 0), vec2(0, 1), vec2(1, 1));     // ...
      this.indices.push(0, 1, 2, 1, 3, 2);                                   // Two triangles this time, indexing into four distinct vertices.
    }
  }, Shape)

// *********** TETRAHEDRON ***********
Declare_Any_Class("Tetrahedron",              // A demo of flat vs smooth shading.  Also our first 3D, non-planar shape.
  {
    'populate': function (using_flat_shading) // Takes a boolean argument
    {
      var a = 1 / Math.sqrt(3);

      if (!using_flat_shading)                                                 // Method 1:  A tetrahedron with shared vertices.  Compact, performs
      {                                                                 // better, but can't produce flat shading or discontinuous seams in textures.
        this.positions.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1));
        this.normals.push(vec3(-a, -a, -a), vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1));
        this.texture_coords.push(vec2(0, 0), vec2(1, 0), vec2(0, 1), vec2(1, 1));
        this.indices.push(0, 1, 2, 0, 1, 3, 0, 2, 3, 1, 2, 3);                     // Vertices are shared multiple times with this method.
      }
      else {
        this.positions.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0));         // Method 2:  A tetrahedron with four independent triangles.
        this.positions.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 0, 1));
        this.positions.push(vec3(0, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1));
        this.positions.push(vec3(0, 0, 1), vec3(1, 0, 0), vec3(0, 1, 0));

        this.normals.push(vec3(0, 0, -1), vec3(0, 0, -1), vec3(0, 0, -1));           // Here's where you can tell Method 2 is flat shaded, since
        this.normals.push(vec3(0, -1, 0), vec3(0, -1, 0), vec3(0, -1, 0));           // each triangle gets a single unique normal value.
        this.normals.push(vec3(-1, 0, 0), vec3(-1, 0, 0), vec3(-1, 0, 0));
        this.normals.push(vec3(a, a, a), vec3(a, a, a), vec3(a, a, a));

        this.texture_coords.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0));    // Each face in Method 2 also gets its own set of texture coords
        this.texture_coords.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0));    //(half the image is mapped onto each face).  We couldn't do this
        this.texture_coords.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0));    // with shared vertices -- after all, it involves different results
        this.texture_coords.push(vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0));    // when approaching the same point from different directions.

        this.indices.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);      // Notice all vertices are unique this time.
      }
    }
  }, Shape)

// 2.  MORE DIFFICULT PRIMITIVES:     ------------------------------------------------------------------------------------------------------------------------------

// SURFACE OF REVOLUTION: Produce a curved patch of triangles with rows and columns.  Begin with an input array of points, defining a curved path -- let each point be a row.  
// Sweep the whole curve around the Z axis in equal steps, stopping and storing new points along the way; let each step be a column.  Now we have a flexible "generalized 
// cylinder" spanning an area until total_curvature_angle -- or if zero was passed in for that angle, we linearly extruded the curve instead (translating up y).  Lastly, 
// connect this curved grid of rows and columns into a tesselation of triangles by generating a certain predictable pattern of indices.
Declare_Any_Class("Surface_Of_Revolution",
  {
    populate: function (rows, columns, points, total_curvature_angle = 360, texture_coord_range = [[0, 1][0, 1]]) {
      for (var i = 0; i <= rows; i++)        // Travel down the curve spelled out by the parameter "points"
      {
        var frac = i / rows * (points.length - 1), alpha = frac - Math.floor(frac),   // Which points in that array are we between?
          currPoint = add(scale_vec(1 - alpha, points[Math.floor(frac)]), scale_vec(alpha, points[Math.ceil(frac)])).concat(1),
          tangent = frac - 1 < 0 ? subtract(points[1], points[0]) : subtract(points[Math.ceil(frac)], points[Math.ceil(frac - 1)]);
        normal = normalize(cross(tangent, vec3(0, 1, 0))).concat(0);

        for (var j = 0; j <= columns; j++) {
          var spin = (total_curvature_angle == 0) ? translation(0, j, 0) : rotation(j * total_curvature_angle / columns, 0, 0, 1);
          this.positions.push(mult_vec(spin, currPoint).slice(0, 3)); this.normals.push(mult_vec(spin, normal).slice(0, 3));
          this.texture_coords.push(vec2(j / columns, -i / rows));
        }
      }
      for (var h = 0; h < rows; h++)             // Generate a sequence like this (if #columns is 10):  "1 11 0  11 1 12  2 12 1  12 2 13  3 13 2  13 3 14  4 14 3..." 
        for (var i = 0; i < 2 * columns; i++)
          for (var j = 0; j < 3; j++)
            this.indices.push(h * (columns + 1) + columns * ((i + (j % 2)) % 2) + (Math.floor((j % 3) / 2) ?
              (Math.floor(i / 2) + 2 * (i % 2)) : (Math.floor(i / 2) + 1)));
    }
  }, Shape)                                           //***************************** MORE SHAPES, THAT EXPLOIT THE ABOVE SHAPE TO CONSTRUCT THEMSELVES: *************
Declare_Any_Class("Regular_2D_Polygon",  // Approximates a flat disk / circle
  {
    populate: function (rows, columns) {
      Surface_Of_Revolution.prototype.insert_transformed_copy_into(this, [rows, columns, [vec3(0, 0, 0), vec3(1, 0, 0)]]);
      for (let t in this.texture_coords) { this.texture_coords[t][0] = this.positions[t][0] / 2 + 0.5; this.texture_coords[t][1] = this.positions[t][1] / 2 + 0.5; }
    }
  }, Shape)

Declare_Any_Class("Torus",
  {
    populate: function (rows, columns) {
      var circle_points = [];
      for (var i = 0; i <= rows; i++)   circle_points.push(vec3(7 + Math.cos(i / rows * 2 * Math.PI), 0, Math.sin(i / rows * 2 * Math.PI)));

      Surface_Of_Revolution.prototype.insert_transformed_copy_into(this, [rows, columns, circle_points]);
    }
  }, Shape)
Declare_Any_Class("Sphere",      // With lattitude / longitude divisions; this means singularities are at the mesh's top and bottom.  Alternatives exist.
  {
    populate: function (rows, columns) {
      var circle_points = [];
      for (var i = 0; i <= rows; i++) {
        var x = Math.cos(i / rows * Math.PI - Math.PI / 2)
        var y = 0;

        var z = Math.sin(i / rows * Math.PI - Math.PI / 2);
        circle_points.push(vec3(x, y, z));
      }
      Surface_Of_Revolution.prototype.insert_transformed_copy_into(this, [rows, columns, circle_points]);
    }
  }, Shape)


Declare_Any_Class("Test_Sphere",          // As our shapes get more complicated, we begin using matrices and flow control (including loops) to
  {
    'populate': function (lat, lon, radius)  // generate non-trivial point clouds and connect them.
    {
      var this_shape = this;
      var numIndices = 0;

      function sphere(lat, lon, radius) {
        //The bands that divide the sphere up
        var latitudeBands = lat;
        var longitudeBands = lon;

        //use <= in order to have an extra point, the way the math works, the last point overlaps w/ the first point
        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
          //calculate the horizontal bands
          var theta = latNumber * Math.PI / latitudeBands;
          var sinTheta = Math.sin(theta);
          var cosTheta = Math.cos(theta);

          //calculate the vertical slices
          for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
            //do a bit of math to get the intersection points
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = latNumber / latitudeBands;

            //have the angle, now factor in the radius
            var loc = vec3(radius * x, radius * y, radius * z)
            //push to positions
            this_shape.positions.push(loc);

            //coordinates to map images.
            this_shape.texture_coords.push(vec2(-u, -v));
            this_shape.normals.push(vec3(x, y, z));

          }
        }
        //for every point on the circle, we will indicate which three
        //points create a triangle.  The two triangles create a square.
        for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
          for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            this_shape.indices.push(first);
            this_shape.indices.push(second);
            this_shape.indices.push(first + 1);

            this_shape.indices.push(second);
            this_shape.indices.push(second + 1);
            this_shape.indices.push(first + 1);
          }
        }
      }
      sphere(lat, lon, radius);
    }

  }, Shape)



// 3.  COMPOUND SHAPES, BUILT FROM THE ABOVE HELPER SHAPES      --------------------------------------------------------------------------------------------------------------
Declare_Any_Class("Cube",    // A cube inserts six square strips into its lists.
  {
    populate: function () {
      for (var i = 0; i < 3; i++)
        for (var j = 0; j < 2; j++) {
          var square_transform = mult(rotation(i == 0 ? 90 : 0, vec3(1, 0, 0)), rotation(180 * j - (i == 1 ? 90 : 0), vec3(0, 1, 0)));
          square_transform = mult(square_transform, translation(0, 0, 1));
          Square.prototype.insert_transformed_copy_into(this, [true], square_transform);
        }
    }
  }, Shape)

Declare_Any_Class("Pyramid", {
  populate: function () {
    var object_transform = mat4();
    Tetrahedron.prototype.insert_transformed_copy_into(this, [], object_transform);
    object_transform = mult(object_transform, rotation(90, 0, 1, 0));
    Tetrahedron.prototype.insert_transformed_copy_into(this, [], object_transform);
    object_transform = mult(object_transform, rotation(90, 0, 1, 0));
    Tetrahedron.prototype.insert_transformed_copy_into(this, [], object_transform);
    object_transform = mult(object_transform, rotation(90, 0, 1, 0));
    Tetrahedron.prototype.insert_transformed_copy_into(this, [], object_transform);
  }
}, Shape)

Declare_Any_Class("Quarter_Note", {
  populate: function () {
    var object_transform = mat4();
    Subdivision_Sphere.prototype.insert_transformed_copy_into(this, [4], mult(object_transform, scale(1.4, 1, 1)));
    object_transform = mult(object_transform, translation(1.13, 2.4, 0));
    Cube.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.2, 2.5, .2)));

  }
}, Shape)

Declare_Any_Class("Music_Note", {
  populate: function () {
    var object_transform = mat4();
    Quarter_Note.prototype.insert_transformed_copy_into(this, [], object_transform);
    object_transform = mult(object_transform, translation(4, 1, 0));
    Quarter_Note.prototype.insert_transformed_copy_into(this, [], mult(object_transform, translation(0, -.15, 0)));

    object_transform = mult(object_transform, translation(-1, 4.2, 0));
    object_transform = mult(object_transform, rotation(10, 0, 0, 1));
    Cube.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(2.1, .2, .2)));

  }
}, Shape)


Declare_Any_Class("Bird",    // A star composed of two tetrahedrons
  {
    populate: function () {

      //head
      object_transform = mat4();
      object_transform = mult(object_transform, rotation(90, 1, 0, 0))
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.3, .7, .2)));
      object_transform = mat4();
      object_transform = mult(object_transform, translation(0, .2, -.5))
      Subdivision_Sphere.prototype.insert_transformed_copy_into(this, [1], mult(object_transform, scale(.8, .8, .8)));

      //body
      object_transform = mult(object_transform, translation(0, -1.6, -1.5))
      object_transform = mult(object_transform, rotation(40, 1, 0, 0))
      Subdivision_Sphere.prototype.insert_transformed_copy_into(this, [2], mult(object_transform, scale(.9, 2, 1)));

      object_transform = mat4();
      object_transform = mult(object_transform, translation(.2, .35, 0));
      Subdivision_Sphere.prototype.insert_transformed_copy_into(this, [1], mult(object_transform, scale(.07, .07, .07)));

      object_transform = mat4();
      object_transform = mult(object_transform, translation(-.2, .35, 0));
      Subdivision_Sphere.prototype.insert_transformed_copy_into(this, [1], mult(object_transform, scale(.07, .07, .07)));

      //wings (left, right)
      object_transform = mat4();
      object_transform = mult(object_transform, translation(-1.3, -.7, -1.7))
      object_transform = mult(object_transform, rotation(15, 1, 0, 0))
      object_transform = mult(object_transform, rotation(90, 0, 0, 1))
      Bird_Wing.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.3, .8, .5)));

      object_transform = mat4();
      object_transform = mult(object_transform, translation(1.3, -.7, -1.7))
      object_transform = mult(object_transform, rotation(180, 0, 1, 0))
      object_transform = mult(object_transform, rotation(-15, 1, 0, 0))
      object_transform = mult(object_transform, rotation(90, 0, 0, 1))
      Bird_Wing.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.3, .8, .5)));

      //feet (right, left)
      object_transform = mat4();
      object_transform = mult(object_transform, translation(.3, -2.7, -2.4));
      object_transform = mult(object_transform, rotation(30, 0, 0, 1))
      object_transform = mult(object_transform, rotation(40, 1, 0, 0))
      Cube.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.15, .35, .15)));

      object_transform = mat4();
      object_transform = mult(object_transform, translation(-.3, -2.7, -2.4));
      object_transform = mult(object_transform, rotation(-30, 0, 0, 1))
      object_transform = mult(object_transform, rotation(40, 1, 0, 0))
      Cube.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.15, .35, .15)));

      //tail
      object_transform = mat4();
      object_transform = mult(object_transform, translation(0, -1.9, -3.2));
      // object_transform = mult(object_transform, rotation(-45, 0, 1, 0))
      object_transform = mult(object_transform, rotation(-20, 1, 0, 0))
      Cube.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(.5, .2, 1.1)));

    }
  }, Shape)

Declare_Any_Class("Bird_Wing", {
  populate: function () {
    var object_transform = mat4();

    Cube.prototype.insert_transformed_copy_into(this, [], object_transform);

    object_transform = mult(object_transform, translation(0, 1, 0));
    object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
    Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, 1.5, 1.42)));
  }
}, Shape)

Declare_Any_Class("Cube_Star",
  {
    populate: function (pointFactor) {
      if (pointFactor == null) {
        pointFactor = 2;
      }

      object_transform = mat4();

      Cube.prototype.insert_transformed_copy_into(this, [], object_transform);

      //top
      object_transform = mult(object_transform, translation(0, 1, 0));
      object_transform = mult(object_transform, rotation(0, 1, 0, 0));
      object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, pointFactor, 1.42)));

      //bottom
      object_transform = mat4();
      object_transform = mult(object_transform, translation(0, -1, 0));
      object_transform = mult(object_transform, rotation(180, 1, 0, 0));
      object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, pointFactor, 1.42)));

      //front
      object_transform = mat4();
      object_transform = mult(object_transform, translation(0, 0, 1));
      object_transform = mult(object_transform, rotation(90, 1, 0, 0));
      object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, pointFactor, 1.42)));

      //back
      object_transform = mat4();
      object_transform = mult(object_transform, translation(0, 0, -1));
      object_transform = mult(object_transform, rotation(90, -1, 0, 0));
      object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, pointFactor, 1.42)));

      //left face
      object_transform = mat4();
      object_transform = mult(object_transform, translation(-1, 0, 0));
      object_transform = mult(object_transform, rotation(90, 0, 0, 1));
      object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, pointFactor, 1.42)));

      //right face
      object_transform = mat4();
      object_transform = mult(object_transform, translation(1, 0, 0));
      object_transform = mult(object_transform, rotation(90, 0, 0, -1));
      object_transform = mult(object_transform, rotation(-45, 0, 1, 0));
      Pyramid.prototype.insert_transformed_copy_into(this, [], mult(object_transform, scale(1.42, pointFactor, 1.42)));
    }

  }, Shape)



Declare_Any_Class("Star",    // A star composed of two tetrahedrons
  {
    populate: function () {
      var object_transform = mat4();
      object_transform = mult(object_transform, translation(0, 2, 0));
      object_transform = mult(object_transform, scale(2, 4.8, 2));
      object_transform = mult(object_transform, rotation(120, vec3(1, 0, 0)));
      object_transform = mult(object_transform, rotation(-45, vec3(0, 1, 0)));
      Tetrahedron.prototype.insert_transformed_copy_into(this, [], object_transform);

      object_transform = mat4();
      object_transform = mult(object_transform, translation(0, -2, 0));
      object_transform = mult(object_transform, rotation(180, vec3(1, 0, 0)));
      object_transform = mult(object_transform, scale(2, 4.8, 2));
      object_transform = mult(object_transform, rotation(120, vec3(1, 0, 0)));
      object_transform = mult(object_transform, rotation(-45, vec3(0, 1, 0)));
      Tetrahedron.prototype.insert_transformed_copy_into(this, [], object_transform);
    }

  }, Shape)



Declare_Any_Class("Subdivision_Sphere",      // A subdivision surface ( Wikipedia ) is initially simple, then builds itself into a more and more detailed shape of the same 
  {                                           // layout.  Each act of subdivision makes it a better approximation of some desired mathematical surface by projecting each new 
    // point onto that surface's known implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For 
    // each face, connect the midpoints of each edge together to make more faces.  Repeat recursively until the desired level of 
    populate: function (max_subdivisions)   // detail is obtained.  Project all new vertices to unit vectors (onto the unit sphere) and group them into triangles by 
    {                                       // following the predictable pattern of the recursion.
      this.positions.push([0, 0, -1], [0, .9428, .3333], [-.8165, -.4714, .3333], [.8165, -.4714, .3333]);  // Start with this equilateral tetrahedron

      var subdivideTriangle = function (a, b, c, count)   // This function will recurse through each level of detail by splitting triangle (a,b,c) into four smaller ones.
      {
        if (count <= 0) { this.indices.push(a, b, c); return; }  // Base case of recursion - we've hit the finest level of detail we want.

        var ab_vert = normalize(mix(this.positions[a], this.positions[b], 0.5)),     // We're not at the base case.  So,
          ac_vert = normalize(mix(this.positions[a], this.positions[c], 0.5)),     // build 3 new vertices at midpoints, and extrude them out to
          bc_vert = normalize(mix(this.positions[b], this.positions[c], 0.5));     // touch the unit sphere (length 1).

        var ab = this.positions.push(ab_vert) - 1,      // Here, push() returns the indices of the three new vertices (plus one).
          ac = this.positions.push(ac_vert) - 1,
          bc = this.positions.push(bc_vert) - 1;

        subdivideTriangle.call(this, a, ab, ac, count - 1);      // Recurse on four smaller triangles, and we're done.
        subdivideTriangle.call(this, ab, b, bc, count - 1);      // Skipping every fourth vertex index in our list takes you down one level of detail, and 
        subdivideTriangle.call(this, ac, bc, c, count - 1);      // so on, due to the way we're building it.
        subdivideTriangle.call(this, ab, bc, ac, count - 1);
      }
      subdivideTriangle.call(this, 0, 1, 2, max_subdivisions);  // Begin recursion.
      subdivideTriangle.call(this, 3, 2, 1, max_subdivisions);
      subdivideTriangle.call(this, 1, 0, 3, max_subdivisions);
      subdivideTriangle.call(this, 0, 2, 3, max_subdivisions);

      for (let p of this.positions) {
        this.normals.push(p.slice());    // Each point has a normal vector that simply goes to the point from the origin.  Copy array value using slice().
        this.texture_coords.push(vec2(.5 + Math.atan2(p[2], p[0]) / 2 / Math.PI, .5 - 2 * Math.asin(p[1]) / 2 / Math.PI));
      }
    }
  }, Shape)