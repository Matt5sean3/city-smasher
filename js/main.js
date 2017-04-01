
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
        /* In the ideal case, this would be  */
        /* Make the geometry a static body */
        if(this.data.static)
            this.el.setAttribute("static-body", true);
        else
            this.el.setAttribute("dynamic-body", true);

        if(this.el.components.geometry.data.primitive != "box") {
            console.warn("Only boxes can be made destructible");
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


/* Grab a dynamic body using the hand controls */
AFRAME.registerComponent("grabber", {
    "schema": {
        "range": { "default": 20 },
        "body": { "type": "selector" }
    },
    "init": function() {
        if(!this.data.body)
            this.data.body = this.el;
        var body = this.data.body;
        /* The component also needs raycaster functionality */
        body.setAttribute("raycaster", {
            "far": this.data.range,
            "objects": "[dynamic-body]"
        });
        this.el.addEventListener("gripclose", this.grab.bind(this));
        this.el.addEventListener("gripopen", this.release.bind(this));
    },
    "grab": function() {
        var body = this.data.body;
        var ray = body.raycaster;
        ray.refreshObjects();
        /* Nothing to grab */
        if(ray.intersectedEls.length < 1)
            return;

        /* Set the constraint attribute */
        body.setAttribute("constraint", {
            "type": "lock",
            "target": ray.intersectedEls[0]
        });
    },
    "release": function() {
        var body = this.data.body;
        body.removeAttribute("constraint");
    }
});

/* Create hands that respond to dynamic impacts */
AFRAME.registerComponent("dynamic-hand", {
    "schema": {
        "side": { "type": "string", "oneOf": ["left", "right"] }
    },
    "init": function() {

        if(!this.el.hasAttribute("dynamic-body"))
            this.el.setAttribute("dynamic-body", {});

        var staticHand = document.createElement("a-entity");
        staticHand.setAttribute("visible", false);
        staticHand.setAttribute("hand-controls", this.data.side);
        staticHand.setAttribute("static-body", {
            "shape": "none"
        });
        this.el.parentNode.appendChild(staticHand);
        staticHand.setAttribute("constraint", {
            "type": "distance",
            "distance": 0.01,
            "target": this.el
        });

        /* Helper entities */
        this.link = null;
        this.staticHand = staticHand;

        /* Pass the hand-control events through to this object */
        var passed = [
            "gripclose",
            "gripopen",
            "pointup",
            "pointdown",
            "thumbup",
            "thumbdown",
            "pointingstart",
            "pointingend",
            "pistolstart",
            "pistolend"];
        for(var i = 0; i < passed.length; i++)
            this.staticHand.addEventListener(passed[i], this.el.emit.bind(this.el, passed[i]));
    },
    "remove": function() {
        /* Remove the static hand */
        this.staticHand.parentNode.removeElement(this.staticHand);
    }
});

AFRAME.registerComponent("city-block", {
    "schema": {
        /* Human scale by default */
        "scale": { "default": 1.0 },
        /* Mostly just a heuristic of number of average floors per square foot */
        "density": { "default": 0.5 },
        /* Ratio of developed square footage to undeveloped */
        "developed": { "default": 0.85 },
        /* The type of buildings to generate */
        "profile": { "default": "business", "oneOf": ["business", "retail", "residential"] }
    },
    "init": function() {
        /* Examines geometry for upward facing facets */
        if(this.el.components.geometry.primitive !== "plane") {
            console.warn("Only planes can have city blocks built upon them");
            return;
        }
        if(this.data.developed > 1.0) {
            console.warn("Cannot have more than 100% of the block built");
            this.data.developed = 1.0;
        } else if(this.data.developed < 0.0) {
            console.warn("Cannot have less than 0% of the block built");
            this.data.developed = 0.0;
        }
        var width = this.el.components.geometry.width / scale,
            depth = this.el.components.geometry.height / scale,
            area = width * depth,
            builtArea = area * this.data.developed,
            builtFootage = area * this.data.density;
        
    }
});

