#CS 174A Project-Group 24#

Our goal is to provide a fun, informative, and creative music visualization. We break down a song into different parts and interpret it in a several unique ways. The inspiration for this project comes from the graphics displayed in the background during concerts / music shows. A lot of artists have creative visuals that not only entertain but enhance the live music experience for the audience.

One quick note: This works in Firefox but is a bit buggy in Chrome, so please bear with us. Also, our advanced topic is collision detection, which was in part implemented by Garret but we had to make a few changes to make sure that it would work okay with our scene.

We created 6 main scenes, each of which visualizes data in its own unique way.

###Main Scene (Center, Collision Detection)
In the center of our project, we have a star and some music notes. This part hopefully gives the viewers a sense of the beat of the song, as well as the volume too. This was done by scaling the star with the volume. More noticeable are the music notes that come at a frequency calculated from the beats per minute of the song. They move along the z axis in a positive direction until collide with the center object; the music note vanishes and becomes a "hollow" square that expands outward, giving a beat to the song. We tried to make this look as smooth and clean as possible.

The collision detection code was completely refactored and added to in order to incorporate it with our scene and make everything work fine. Essentially, it creates a sphere of detection so to speak, and if any other object (that is also a collision object) is within this area, then it collides. 

###Equalizer (Center)
Also in the center, you can see there is an equalizer. It represent the amplitude of different frequencies in the song. The frequency bins are obtained through a FFT analysis of the song. Since there are multiple data points to be represented, we went with a circular representation. The inner ring represents the frequencies with the highest portion in the audio spectrum and the outer ring represents the mellowed frequencies. We used different shapes namely pyramid and 3d triangle to represent the bars in the inner and outer rings respectively, giving it an edgy, contrasting effect.

###3D Triangle and Spheres (Top Left)
The top left scene is drawn with a 3D triangle and three spheres. This was an attempt to visualize the music by generating a rougher or smoother shape given both the treble and the bass. These three spheres are latitude-longitude band spheres. The values for the volume of the treble and the bass were scaled down between 4 and 16 to generate either a rough or smooth sphere. The bass was passed into the latitude, and the treble was passed into the longitude, and the volume had an ever so slight effect on the size of the sphere to give a cleaner look.

###Bird (Bottom Left)
The bottom left scene is somewhat of an abstract take on things. We attempted to examine the difference between the bass and treble because it is a bit difficult to tell the difference in bass and treble in many cases. The left wing was made to flap based on the treble, and the right wing flapped based on the bass. The values for treble and bass were scaled accordingly, of course. A side note is that the bird does fly to the beat of this song.

###(Top Right)
The top right scene represents a portion of the bass and treble frequency data for the song in the form of bars aligned next to each other. These bars are made out of cubes scaled according to the amplitudes of frequencies in the bass and treble range. The left and right halves showcase the bass and treble data respectively. As we can see clearly, bass has lower amplitudes than treble for the same frequency. 

###(Bottom Right)
The bottom right scene represents a pyramid with a cube on top. The visuals show the cube trying to balance itself on the tip of the pyramid. The cube is rotated along the x and y axes at the rate of average volume computed over treble frequencies data. In other words, the high frequency sounds drive the visual rotation of the cube. 

