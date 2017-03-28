
require('aframe');

var physics = require('aframe-physics-system');
physics.registerAll();

/* Generate a city */
AFRAME.registerComponent("destructible", {
    "schema": {
        "static": { "default": true },
        "mass": { "default": 1 },
        "strength": { "default": 5 },
        "x_splits": { "default": 3 },
        "y_splits": { "default": 3 },
        "z_splits": { "default": 3 }
    },
    "init": function() {
        /* Make the geometry a static body */
        if(this.data.static)
            this.el.setAttribute("static-body", true);
        else
            this.el.setAttribute("dynamic-body", true);

        if(this.el.components.geometry.data.primitive != "box") {
            alert("Only boxes can be made destructible");
            return;
        }
        this.el.addEventListener("collide", function(e) {
            /* Fundamentally, the geometry needs to be a box to be destructible for now */
            var destructible = this.components.destructible;

            var strength = destructible.data.strength;
            var isStatic = destructible.data.static;

            /* If sufficiently collided with, this will fragment into smaller geometry */
            var v = e.detail.contact.getImpactVelocityAlongNormal();
            if(v > strength) {
                /* Poof the existing geometry */
                var base = this.parentNode;
                base.removeChild(this);
                var position = this.components.position;
                var geometry = this.components.geometry;
                var xSplits = destructible.data.x_splits;
                var ySplits = destructible.data.y_splits;
                var zSplits = destructible.data.z_splits;
                var blockWidth = geometry.data.width / xSplits;
                var blockHeight = geometry.data.height / ySplits;
                var blockDepth = geometry.data.depth / zSplits;
                /* Getting really lazy, just split into blocks */
                destructible.makeBlocks(
                    base,
                    destructible.data.mass,
                    [blockWidth, blockHeight, blockDepth],
                    [xSplits, ySplits, zSplits],
                    [position.data.x, position.data.y, position.data.z]);
            }
        });
        /* Make all the splinter geometry destructable */
    },
    "makeBlocks": function(base, mass, dims, sizes, offset) {
        
        var numChunks = sizes[0] * sizes[1] * sizes[2];
        var chunkMass = mass / numChunks;
        var centeredOffset = [
            offset[0] - dims[0] * (sizes[0] - 1) / 2,
            offset[1] - dims[1] * (sizes[1] - 1) / 2,
            offset[2] - dims[2] * (sizes[2] - 1) / 2];
        /* Create lots of boxes */
        for(var i = 0; i < sizes[0]; i++)
            for(var j = 0; j < sizes[1]; j++)
                for(var k = 0; k < sizes[2]; k++) {
                    var box = document.createElement("a-entity");
                    box.setAttribute("geometry", {
                        "primitive": "box",
                        "width": dims[0],
                        "height": dims[1],
                        "depth": dims[2]
                    });
                    box.setAttribute("position", {
                        "x": i * dims[0] + centeredOffset[0],
                        "y": j * dims[1] + centeredOffset[1],
                        "z": k * dims[2] + centeredOffset[2]
                    });
                    box.setAttribute("dynamic-body", {
                        "mass": chunkMass
                    });
                    box.setAttribute("material", { "color": "#FFF"});
                    base.appendChild(box);
                }
    }
});


/* Reset by holding the trigger on either controllers */
AFRAME.registerComponent("trigger-reset", {
    "init": function() {
        this.el.addEventListener("gripclose", function() {
/*
            document.querySelector("[structure]").components.structure.reset();
*/
        });
    }
});

