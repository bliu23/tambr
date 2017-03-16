"use strict";

var audioElement;
var audioContext;
var source;
var analyser;
var fftsize = 2048;
var fftsize_graph = 64;
var frequencyData;
var shapes_in_use_strings = [];
var totalShapesDrawn = 0;

var mainShapeDrawn = false;

var isHandlingCollision = false;
var handle_start_time;
var collisionBodyNum;
var collisionBodySize;
var isShrinking = false;
var cubeRotDegreeX = 0;
var cubeRotDegreeY = 0;

var beatShapeDrawn = false;
var canDrawNewBeat = true;

var bpm = 131;
var initialBeatInterval = 1 / (bpm / 60 / 4) * 1000 * 2;
var beatInterval = initialBeatInterval;
var totalCollisionTime = 2000;

var bassFilter;
var bassAnalyser;
var bassFrequencyData;

var trebleFilter;
var trebleAnalyser;
var trebleFrequencyData;

var cameraShift = 0;
var birdShift = 0;

var bassFreqData;
var bassAvgVolume;
var trebleFreqData;
var trebleAvgVolume;

var freqData;
var avgVolume;

var sphereMinVal = 4;
var istring = "" + 2;
var jstring = "" + 2;
var kstring = "" + 2;
var sphereString = "sphere440";
var canChange = true;


function setup() {
    audioElement = document.getElementById("audio-file");
    audioContext = new AudioContext();
    source = audioContext.createMediaElementSource(audioElement);

    // Create analysers
    analyser = audioContext.createAnalyser();
    bassAnalyser = audioContext.createAnalyser();
    trebleAnalyser = audioContext.createAnalyser();

    // connect the source to destination
    source.connect(audioContext.destination);

    // connect the source to the analyser for processing
    source.connect(analyser);

    // Set analyser properties
    analyser.fftSize = fftsize;
    analyser.smoothingTimeConstant = 0.3;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);

    // Set bass filter
    bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 1000;
    bassFilter.gain.value = 5;
    bassFilter.Q.value = 1;
    source.connect(bassFilter);
    bassFilter.connect(bassAnalyser);

    // Set bass analyser properties
    bassAnalyser.fftSize = fftsize;
    bassAnalyser.smoothingTimeConstant = 0.3;
    bassFrequencyData = new Uint8Array(bassAnalyser.frequencyBinCount);

    // Set treble filter
    trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = 4000;
    trebleFilter.gain.value = 5;
    trebleFilter.Q.value = 1;
    source.connect(trebleFilter);
    trebleFilter.connect(trebleAnalyser);

    // Set treble analyser properties
    trebleAnalyser.fftSize = fftsize;
    trebleAnalyser.smoothingTimeConstant = 0.3;
    trebleFrequencyData = new Uint8Array(trebleAnalyser.frequencyBinCount);
}

function play() {
    audioElement.currentTime = 0;
    // audioElement.currentTime = 60;
    audioElement.play();
}

function getFrequencyData() {
    analyser.getByteFrequencyData(frequencyData);
    return frequencyData;
}

function getBassFrequencyData() {
    bassAnalyser.getByteFrequencyData(bassFrequencyData);
    return bassFrequencyData;
}

function getTrebleFrequencyData() {
    trebleAnalyser.getByteFrequencyData(trebleFrequencyData);
    return trebleFrequencyData;
}

function getAverageVolume(array) {
    var sum = 0;
    var average;

    // get all the frequency amplitudes
    for (var i = 0; i < array.length; i++) {
        sum += array[i];
    }

    average = sum / array.length;
    return average;
}

function toggleAudio() {
    if (audioElement.paused) {
        audioElement.play();
    }
    else {
        audioElement.pause();
    }
}

//Easy helper function to get a mat3 for scale functions
function mat3Scale(scaleSize) {
    return [scaleSize, scaleSize, scaleSize]
}

function drawBeatShape(context) {
    var locMatrix = mat4();
    locMatrix = mult(locMatrix, translation(-.5, -.2, -67.06));
    console.log(-67.06);
    //If staring 60 seconds in...
    //locMatrix = mult(locMatrix, translation(-.5, -.2, -2.16));
    var mat = new Material(Color(1, 1, 1, 1), .4, .9, .9, 40);
    var scaleMatrix = mat3Scale(.5);
    context.bodies.push(new Body(context.get_shape("music_note"), scaleMatrix, locMatrix, .005, 0, [0, 0, 1], mat, false, "beat"));
}

//get the scaled bass volume
function getBassVol() {
    var bass = bassAvgVolume - 17
    if (bass < 0) {
        bass = 0;
    }
    bass = Math.floor(bass / 1.2 + sphereMinVal);
    if (bass >= 17) {
        bass = 16;
    }

    //slight adjustments if bass is really low...
    if (bassAvgVolume < 5) {
        bass = Math.floor(bassAvgVolume);
        if (bass < 0) {
            bass = 0;
        }
        bass += 4;
    }
    return bass;
}

//get the scaled treble volume
function getTrebleVol() {
    var treble;
    if (trebleAvgVolume !== 0) {
        treble = Math.floor(trebleAvgVolume / 8);
    }
    treble -= 4;
    if (treble < 0) {
        treble = 0;
    }
    treble += sphereMinVal;
    if (treble >= 17) {
        treble = 16;
    }
    //slight adjustments if treble is really low
    if (trebleAvgVolume < 28) {
        treble = Math.floor(trebleAvgVolume - 22);
        if (treble < 0) {
            treble = 0;
        }
        treble += 4;
    }
    return treble;

}