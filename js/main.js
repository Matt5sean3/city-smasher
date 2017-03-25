
require('aframe');

var physics = require('aframe-physics-system');
physics.registerAll();

/* Generate a city */
AFRAME.registerComponent("structure", {
    "schema": {
        "block_width": { "default": 0.1 },
        "block_height": { "default": 0.1 },
        "block_depth": { "default": 0.1 },
        "blocks_wide": { "default": 5 },
        "blocks_high": { "default": 10 },
        "blocks_deep": { "default": 5 }
    },
    "init": function() {
        /* Create lots of boxes */
        for(var i = 0; i < this.data.num_blocks_wide; i++)
            for(var j = 0; j < this.data.num_blocks_high; j++)
                for(var k = 0; k < this.data.num_blocks_deep; k++) {
                    var box = document.createElement("a-entity");
                    box.setAttribute("geometry", {
                        "primitive": "box",
                        "width": this.data.block_width,
                        "height": this.data.block_height,
                        "depth": this.data.block_depth
                    });
                    box.setAttribute("position", {
                        "x": i * this.data.block_width,
                        "y": j * this.data.block_height,
                        "z": k * this.data.block_depth
                    });
                    box.setAttribute("dynamic-body", true);
                    box.setAttribute("color", "#FF0000");
                    this.el.appendChild(box);
                }
    },
    "reset": function() {
        console.log("Resetting");
    }
});


/* Reset by holding the trigger on either controllers */
AFRAME.registerComponent("trigger-reset", {
    "init": function() {
        this.index = triggers.length;
        this.el.addEventListener("gripclose", function() {
            document.querySelector("a-plane[structure]").reset();
        });
    }
});

