var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./LayerBase", "../LayerType", "../Vol"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("./LayerBase");
    var LayerType_1 = require("../LayerType");
    var Vol_1 = require("../Vol");
    var PoolLayer = (function (_super) {
        __extends(PoolLayer, _super);
        function PoolLayer(options) {
            if (options === void 0) { options = {}; }
            var in_sx = options.in_sx, in_sy = options.in_sy, in_depth = options.in_depth, sx = options.sx, sy = options.sy, stride = options.stride;
            var pad = typeof options.pad !== 'undefined' ? options.pad : 0; // amount of 0 padding to add around borders of input volume
            // note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
            // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
            // final application.
            _super.call(this, LayerType_1.LayerType.Pool, Math.floor((in_sx + pad * 2 - sx) / stride + 1), Math.floor((in_sy + pad * 2 - sy) / stride + 1), in_depth);
            this.in_depth = in_depth;
            this.in_sx = in_sx;
            this.in_sy = in_sy;
            this.sx = sx; // filter size. Should be odd if possible, it's cleaner.
            // optional
            this.sy = typeof sy !== 'undefined' ? sy : sx;
            this.stride = typeof stride !== 'undefined' ? stride : 2;
            this.pad = pad;
            // store switches for x,y coordinates for where the max comes from, for each output neuron
            this.switchx = new Float64Array(this.out_sx * this.out_sy * this.out_depth);
            this.switchy = new Float64Array(this.out_sx * this.out_sy * this.out_depth);
        }
        PoolLayer.prototype.forward = function (V) {
            this.in_act = V;
            var A = new Vol_1.Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
            var n = 0; // a counter for switches
            for (var d = 0; d < this.out_depth; d++) {
                var x = -this.pad;
                var y = -this.pad;
                for (var ax = 0; ax < this.out_sx; x += this.stride, ax++) {
                    y = -this.pad;
                    for (var ay = 0; ay < this.out_sy; y += this.stride, ay++) {
                        // convolve centered at this particular location
                        var a = -99999; // hopefully small enough ;\
                        var winX = -1, winy = -1;
                        for (var fx = 0; fx < this.sx; fx++) {
                            for (var fy = 0; fy < this.sy; fy++) {
                                var oy = y + fy;
                                var ox = x + fx;
                                if (oy >= 0 && oy < V.sy && ox >= 0 && ox < V.sx) {
                                    var v = V.get(ox, oy, d);
                                    // perform max pooling and store pointers to where
                                    // the max came from. This will speed up back-prop
                                    // and can help make nice visualizations in future
                                    if (v > a) {
                                        a = v;
                                        winX = ox;
                                        winy = oy;
                                    }
                                }
                            }
                        }
                        this.switchx[n] = winX;
                        this.switchy[n] = winy;
                        n++;
                        A.set(ax, ay, d, a);
                    }
                }
            }
            this.out_act = A;
            return this.out_act;
        };
        PoolLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            // pooling layers have no parameters, so simply compute
            // gradient wrt data here
            var V = this.in_act;
            V.dw = new Float64Array(V.w.length); // zero out gradient wrt data
            var A = this.out_act; // computed in forward pass
            var n = 0;
            for (var d = 0; d < this.out_depth; d++) {
                var x = -this.pad;
                var y = -this.pad;
                for (var ax = 0; ax < this.out_sx; x += this.stride, ax++) {
                    y = -this.pad;
                    for (var ay = 0; ay < this.out_sy; y += this.stride, ay++) {
                        var chain_grad = A.get_grad(ax, ay, d);
                        V.add_grad(this.switchx[n], this.switchy[n], d, chain_grad);
                        n++;
                    }
                }
            }
        };
        PoolLayer.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.sx = this.sx;
            json.sy = this.sy;
            json.stride = this.stride;
            json.in_depth = this.in_depth;
            json.pad = this.pad;
            return _super.prototype.toJSON.call(this, json);
        };
        PoolLayer.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.sx = json.sx;
            this.sy = json.sy;
            this.stride = json.stride;
            this.in_depth = json.in_depth;
            this.pad = typeof json.pad !== 'undefined' ? json.pad : 0; // backwards compatibility
            this.switchx = new Float64Array(this.out_sx * this.out_sy * this.out_depth); // need to re-init these appropriately
            this.switchy = new Float64Array(this.out_sx * this.out_sy * this.out_depth);
            return this;
        };
        return PoolLayer;
    }(LayerBase_1.LayerBase));
    exports.PoolLayer = PoolLayer;
});
//# sourceMappingURL=Pool.js.map