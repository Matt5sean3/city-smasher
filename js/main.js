
require('aframe');

var physics = require('aframe-physics-system');
physics.registerAll();

/* Generate a city */
AFRAME.registerComponent("structure", {
    "schema": {
        "block_width": { "default": 0.5 },
        "block_height": { "default": 0.5 },
        "block_depth": { "default": 0.5 },
        "block_mass": { "default": 0.1 },
        "blocks_wide": { "default": 3 },
        "blocks_high": { "default": 5 },
        "blocks_deep": { "default": 3 },
        "prefix": { "default": "" }
    },
    "init": function() {
        var platform = document.createElement("a-entity");
        platform.setAttribute("geometry", {
            "width": this.data.block_width * blocks_wide + 1,
            "height": this.data.block_depth * blocks_deep + 1
        });
        platform.setAttribute("rotation", {
            "x": -90,
            "y": 0,
            "z": 0
        });
        platform.setAttribute("static-body", true);
        this.el.appendChild(platform);
        this.makeStructure();
    },
    "makeStructure": function() {
        var dims = [
            this.data.block_width,
            this.data.block_height,
            this.data.block_depth];
        var sizes = [
            this.data.blocks_width,
            this.data.blocks_high,
            this.data.blocks_deep];
        var offset = [
            0,
            dims[1] / 2,
            0];
        /* Create lots of boxes */
        for(var i = 0; i < sizes[0]; i++)
            for(var j = 0; j < sizes[1]; j++)
                for(var k = 0; k < sizes[2]; k++) {
                    var box = document.createElement("a-entity");
                    /* Needs to use the mesh mixin */
                    box.setAttribute("geometry", {
                        "primitive": "box",
                        "width": dims[0],
                        "height": dims[1],
                        "depth": dims[2]
                    });
                    box.setAttribute("position", {
                        "x": i * dims[0] + offset[0],
                        "y": j * dims[1] + offset[1],
                        "z": k * dims[2] + offset[2] 
                    });
                    box.setAttribute("dynamic-body", {
                        "mass": this.data.block_mass
                    });
                    box.setAttribute("color", "#FF0000");
                    this.el.appendChild(box);
                }
    },
    "reset": function() {
        var boxes = this.el.querySelectorAll(".structure-boxes");
        for(var i = 0; i < boxes.length; i++) {
            this.el.removeChild(boxes[i]);
        }
        this.makeStructure();
    }
});


/* Reset by holding the trigger on either controllers */
AFRAME.registerComponent("trigger-reset", {
    "init": function() {
        this.el.addEventListener("gripclose", function() {
            document.querySelector("[structure]").components.structure.reset();
        });
    }
});

