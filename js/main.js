
require('aframe');

var physics = require('aframe-physics-system');
physics.registerAll();

/* I don't like how there's so many global variables here */
var leftPointing = false;
var rightPointing = false;

/* Reset by holding the trigger on both controllers */
var scene = document.querySelector('a-scene');

scene.reload();

var leftHand = document.querySelector('#left-hand[hand-controls]');
var rightHand = document.querySelector('#right-hand[hand-controls]');

leftHand.addEventListener("pointup", function() {
    leftPointing = true;
}, false);

leftHand.addEventListener("pointdown", function() {
    leftPointing = false;
    if(rightPointing)
        scene.reload();
}, false);

rightHand.addEventListener("pointup", function() {
    rightPointing = true;
}, false);
rightHand.addEventListener("pointdown", function() {
    rightPointing = false;
    if(leftPointing)
        scene.reload();
}, false);

