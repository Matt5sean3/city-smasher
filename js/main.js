
require('aframe');

var physics = require('aframe-physics-system');
physics.registerAll();

/* Reset by holding the trigger on both controllers */
AFRAME.registerComponent("trigger-reset", {
    "init": function() {
        this.index = triggers.length;
        this.el.addEventListener("pointup", function() {
            document.querySelector("a-scene").reload();
        });
    }
});

