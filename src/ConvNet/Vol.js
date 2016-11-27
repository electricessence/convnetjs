(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "typescript-dotnet-umd/System/Types", "typescript-dotnet-umd/System/Exceptions/ArgumentException", "typescript-dotnet-umd/System/Collections/Array/Utility", "../utility/Random"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Types_1 = require("typescript-dotnet-umd/System/Types");
    var ArgumentException_1 = require("typescript-dotnet-umd/System/Exceptions/ArgumentException");
    var Utility_1 = require("typescript-dotnet-umd/System/Collections/Array/Utility");
    var Random_1 = require("../utility/Random");
    /**
     * Vol is the basic building block of all data in a net.
     * it is essentially just a 3D volume of numbers, with a
     * width (sx), height (sy), and depth (depth).
     * it is used to hold data for all filters, all volumes,
     * all weights, and also stores all gradients w.r.t.
     * the data. c is optionally a value to initialize the volume
     * with. If c is missing, fills the Vol with random numbers.
     */
    var Vol = (function () {
        function Vol(sx, sy, depth, c) {
            var w = new Float64Array(depth);
            this.dw = new Float64Array(depth);
            this.w = w;
            var i;
            if (Types_1.Type.isNumber(sx, true)) {
                if (isNaN(sx))
                    throw new ArgumentException_1.ArgumentException("sx", "Is NaN.");
                // we were given dimensions of the vol
                this.sx = sx;
                this.sy = sy;
                this.depth = depth;
                var n = sx * sy * depth;
                if (Types_1.Type.isNullOrUndefined(c)) {
                    // weight normalization is done to equalize the output
                    // variance of every neuron, otherwise neurons with a lot
                    // of incoming connections have outputs of larger variance
                    var scale = Math.sqrt(1.0 / n);
                    for (i = 0; i < n; i++) {
                        this.w[i] = Random_1.Random.n(0.0, scale);
                    }
                }
                else {
                    this.from(sx, sy, depth, c);
                }
            }
            else {
                // we were given a list in sx, assume 1D volume and fill it up
                this.from(1, 1, sx.length, sx);
            }
        }
        Vol.prototype.get = function (x, y, d) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            return this.w[ix];
        };
        Vol.prototype.set = function (x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.w[ix] = v;
        };
        Vol.prototype.add = function (x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.w[ix] += v;
        };
        Vol.prototype.get_grad = function (x, y, d) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            return this.dw[ix];
        };
        Vol.prototype.set_grad = function (x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.dw[ix] = v;
        };
        Vol.prototype.add_grad = function (x, y, d, v) {
            var ix = ((this.sx * y) + x) * this.depth + d;
            this.dw[ix] += v;
        };
        Vol.prototype.cloneAndZero = function () {
            return new Vol(this.sx, this.sy, this.depth, 0.0);
        };
        Vol.prototype.clone = function () {
            var V = new Vol(this.sx, this.sy, this.depth, 0.0);
            var n = this.w.length;
            for (var i = 0; i < n; i++) {
                V.w[i] = this.w[i];
            }
            return V;
        };
        Vol.prototype.addFrom = function (V) {
            Utility_1.applyTo(this.w, function (v, i) { return v + V.w[i]; });
        };
        Vol.prototype.addFromScaled = function (V, a) {
            Utility_1.applyTo(this.w, function (v, i) { return v + a * V.w[i]; });
        };
        Vol.prototype.setConst = function (a) {
            Utility_1.updateRange(this.w, a);
        };
        Vol.prototype.toJSON = function () {
            return {
                sx: this.sx,
                sy: this.sy,
                depth: this.depth,
                w: this.w
            };
            // we wont back up gradients to save space
        };
        Vol.prototype.from = function (sx, sy, depth, w) {
            this.sx = sx;
            this.sy = sy;
            this.depth = depth;
            var n = sx * sy * depth;
            this.w = new Float64Array(n);
            this.dw = new Float64Array(n);
            if (Types_1.Type.isNumber(w)) {
                Utility_1.updateRange(this.w, w);
            }
            else {
                Utility_1.copyTo(this.w, w);
            }
        };
        Vol.prototype.fromJSON = function (json) {
            this.from(json.sx, json.sy, json.depth, json.w);
            return this;
        };
        return Vol;
    }());
    exports.Vol = Vol;
    var Vol;
    (function (Vol) {
        /**
             Volume utilities
             intended for use with data augmentation
             crop is the size of output
             dx,dy are offset wrt incoming volume, of the shift
             fliplr is boolean on whether we also want to flip left<->right
         * @param V
         * @param crop
         * @param dx
         * @param dy
         * @param fliplr
         * @returns {any}
         */
        function augment(V, crop, dx, dy, fliplr) {
            if (dx === void 0) { dx = Random_1.Random.integer(0, V.sx - crop); }
            if (dy === void 0) { dy = Random_1.Random.integer(0, V.sy - crop); }
            if (fliplr === void 0) { fliplr = false; }
            // randomly sample a crop in the input volume
            var d, x, y, W;
            if (crop !== V.sx || dx !== 0 || dy !== 0) {
                W = new Vol(crop, crop, V.depth, 0.0);
                for (x = 0; x < crop; x++) {
                    for (y = 0; y < crop; y++) {
                        if (x + dx < 0 || x + dx >= V.sx || y + dy < 0 || y + dy >= V.sy)
                            continue; // oob
                        for (d = 0; d < V.depth; d++) {
                            W.set(x, y, d, V.get(x + dx, y + dy, d)); // copy data over
                        }
                    }
                }
            }
            else {
                W = V;
            }
            if (fliplr) {
                // flip volume horizontally
                var W2 = W.cloneAndZero();
                for (x = 0; x < W.sx; x++) {
                    for (y = 0; y < W.sy; y++) {
                        for (d = 0; d < W.depth; d++) {
                            W2.set(x, y, d, W.get(W.sx - x - 1, y, d)); // copy data over
                        }
                    }
                }
                W = W2; //swap
            }
            return W;
        }
        Vol.augment = augment;
        // img is a DOM element that contains a loaded image
        // returns a Vol of size (W, H, 4). 4 is for RGBA
        function img_to_vol(img, convert_grayscale) {
            if (convert_grayscale === void 0) { convert_grayscale = false; }
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            if (!ctx)
                throw "Cannot find 2d.";
            // due to a Firefox bug
            try {
                ctx.drawImage(img, 0, 0);
            }
            catch (e) {
                if (e.name === "NS_ERROR_NOT_AVAILABLE") {
                    // sometimes happens, lets just abort
                    return false;
                }
                else {
                    throw e;
                }
            }
            var img_data;
            try {
                img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
            catch (e) {
                if (e.name === 'IndexSizeError') {
                    return false; // not sure what causes this sometimes but okay abort
                }
                else {
                    throw e;
                }
            }
            // prepare the input: get pixels and normalize them
            var p = img_data.data;
            var W = img.width;
            var H = img.height;
            var pv = new Float64Array(p.length);
            var i;
            for (i = 0; i < p.length; i++) {
                pv[i] = p[i] / 255.0 - 0.5; // normalize image pixels to [-0.5, 0.5]
            }
            var x = new Vol(W, H, 4, 0.0); //input volume (image)
            x.w = pv;
            if (convert_grayscale) {
                // flatten into depth=1 array
                var x1 = new Vol(W, H, 1, 0.0);
                for (i = 0; i < W; i++) {
                    for (var j = 0; j < H; j++) {
                        x1.set(i, j, 0, x.get(i, j, 0));
                    }
                }
                x = x1;
            }
            return x;
        }
        Vol.img_to_vol = img_to_vol;
    })(Vol = exports.Vol || (exports.Vol = {}));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Vol;
});
//# sourceMappingURL=Vol.js.map