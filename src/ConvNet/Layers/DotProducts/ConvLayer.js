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
        define(["require", "exports", "../../Vol", "../../LayerType", "./ConvLayerBase"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Vol_1 = require("../../Vol");
    var LayerType_1 = require("../../LayerType");
    var ConvLayerBase_1 = require("./ConvLayerBase");
    var ConvLayer = (function (_super) {
        __extends(ConvLayer, _super);
        function ConvLayer(options) {
            if (options === void 0) { options = {}; }
            var in_sx = options.in_sx, in_sy = options.in_sy, in_depth = options.in_depth, sx = options.sx, sy = options.sy, stride = options.stride;
            var pad = typeof options.pad !== 'undefined' ? options.pad : 0; // amount of 0 padding to add around borders of input volume
            // note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
            // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
            // final application.
            _super.call(this, LayerType_1.LayerType.Conv, Math.floor((in_sx + pad * 2 - sx) / stride + 1), Math.floor((in_sy + pad * 2 - sy) / stride + 1), options.filters, options);
            this.in_depth = in_depth;
            this.in_sx = in_sx;
            this.in_sy = in_sy;
            this.sx = sx; // filter size. Should be odd if possible, it's cleaner.
            // optional
            this.sy = sy = typeof sy !== 'undefined' ? sy : sx;
            this.stride = typeof stride !== 'undefined' ? stride : 1; // stride at which we apply filters to input volume
            this.pad = pad;
            for (var i = 0; i < this.out_depth; i++) {
                this.filters.push(new Vol_1.Vol(sx, sy, in_depth));
            }
        }
        ConvLayer.prototype.forward = function (V) {
            // optimized code by @mdda that achieves 2x speedup over previous version
            this.in_act = V;
            var A = new Vol_1.Vol(this.out_sx | 0, this.out_sy | 0, this.out_depth | 0, 0.0);
            var V_sx = V.sx | 0;
            var V_sy = V.sy | 0;
            var xy_stride = this.stride | 0;
            for (var d = 0; d < this.out_depth; d++) {
                var f = this.filters[d];
                var x = -this.pad | 0;
                var y = -this.pad | 0;
                for (var ay = 0; ay < this.out_sy; y += xy_stride, ay++) {
                    x = -this.pad | 0;
                    for (var ax = 0; ax < this.out_sx; x += xy_stride, ax++) {
                        // convolve centered at this particular location
                        var a = 0.0;
                        for (var fy = 0; fy < f.sy; fy++) {
                            var oy = y + fy; // coordinates in the original input array coordinates
                            for (var fx = 0; fx < f.sx; fx++) {
                                var ox = x + fx;
                                if (oy >= 0 && oy < V_sy && ox >= 0 && ox < V_sx) {
                                    for (var fd = 0; fd < f.depth; fd++) {
                                        // avoid function call overhead (x2) for efficiency, compromise modularity :(
                                        a
                                            += f.w[((f.sx * fy) + fx) * f.depth + fd] * V.w[((V_sx * oy) + ox) * V.depth + fd];
                                    }
                                }
                            }
                        }
                        a += this.biases.w[d];
                        A.set(ax, ay, d, a);
                    }
                }
            }
            this.out_act = A;
            return this.out_act;
        };
        ConvLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act;
            V.dw = new Float64Array(V.w.length); // zero out gradient wrt bottom data, we're about to fill it
            var V_sx = V.sx | 0;
            var V_sy = V.sy | 0;
            var xy_stride = this.stride | 0;
            for (var d = 0; d < this.out_depth; d++) {
                var f = this.filters[d];
                var x = -this.pad | 0;
                var y = -this.pad | 0;
                for (var ay = 0; ay < this.out_sy; y += xy_stride, ay++) {
                    x = -this.pad | 0;
                    for (var ax = 0; ax < this.out_sx; x += xy_stride, ax++) {
                        // convolve centered at this particular location
                        var chain_grad = this.out_act.get_grad(ax, ay, d); // gradient from above, from chain rule
                        for (var fy = 0; fy < f.sy; fy++) {
                            var oy = y + fy; // coordinates in the original input array coordinates
                            for (var fx = 0; fx < f.sx; fx++) {
                                var ox = x + fx;
                                if (oy >= 0 && oy < V_sy && ox >= 0 && ox < V_sx) {
                                    for (var fd = 0; fd < f.depth; fd++) {
                                        // avoid function call overhead (x2) for efficiency, compromise modularity :(
                                        var ix1 = ((V_sx * oy) + ox) * V.depth + fd;
                                        var ix2 = ((f.sx * fy) + fx) * f.depth + fd;
                                        f.dw[ix2] += V.w[ix1] * chain_grad;
                                        V.dw[ix1] += f.w[ix2] * chain_grad;
                                    }
                                }
                            }
                        }
                        this.biases.dw[d] += chain_grad;
                    }
                }
            }
        };
        ConvLayer.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.sx = this.sx; // filter size in x, y dims
            json.sy = this.sy;
            json.in_depth = this.in_depth;
            json.stride = this.stride;
            json.pad = this.pad;
            return _super.prototype.toJSON.call(this, json);
        };
        ConvLayer.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.sx = json.sx; // filter size in x, y dims
            this.sy = json.sy;
            this.in_depth = json.in_depth; // depth of input volume
            this.stride = json.stride;
            this.pad = typeof json.pad !== 'undefined' ? json.pad : 0;
            return this;
        };
        return ConvLayer;
    }(ConvLayerBase_1.ConvLayerBase));
    exports.ConvLayer = ConvLayer;
});
//# sourceMappingURL=ConvLayer.js.map