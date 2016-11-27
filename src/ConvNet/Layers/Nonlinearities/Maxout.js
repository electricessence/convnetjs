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
        define(["require", "exports", "../LayerBase", "../../Vol", "../../LayerType"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("../LayerBase");
    var Vol_1 = require("../../Vol");
    var LayerType_1 = require("../../LayerType");
    /**
     * Implements Maxout non-linearity that computes
     * x -> max(x)
     * where x is a vector of size group_size. Ideally of course,
     * the input size should be exactly divisible by group_size
     */
    var MaxoutLayer = (function (_super) {
        __extends(MaxoutLayer, _super);
        function MaxoutLayer(opt) {
            if (opt === void 0) { opt = {}; }
            var in_sx = opt.in_sx, in_sy = opt.in_sy, in_depth = opt.in_depth;
            var group_size = typeof opt.group_size !== 'undefined' ? opt.group_size : 2;
            var depth = Math.floor(in_depth / group_size);
            _super.call(this, LayerType_1.LayerType.Maxout, in_sx, in_sy, depth);
            // required
            this.group_size = group_size;
            this.switches = new Float64Array(in_sx * in_sy * depth); // useful for back-prop
        }
        MaxoutLayer.prototype.forward = function (V) {
            this.in_act = V;
            var N = this.out_depth;
            var V2 = new Vol_1.Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
            var i, j, ix, a, ai, a2;
            // optimization branch. If we're operating on 1D arrays we don't have
            // to worry about keeping track of x,y,d coordinates inside
            // input volumes. In conv-nets we do :(
            if (this.out_sx === 1 && this.out_sy === 1) {
                for (i = 0; i < N; i++) {
                    ix = i * this.group_size; // base index offset
                    a = V.w[ix];
                    ai = 0;
                    for (j = 1; j < this.group_size; j++) {
                        a2 = V.w[ix + j];
                        if (a2 > a) {
                            a = a2;
                            ai = j;
                        }
                    }
                    V2.w[i] = a;
                    this.switches[i] = ix + ai;
                }
            }
            else {
                var n = 0; // counter for switches
                for (var x = 0; x < V.sx; x++) {
                    for (var y = 0; y < V.sy; y++) {
                        for (i = 0; i < N; i++) {
                            ix = i * this.group_size;
                            a = V.get(x, y, ix);
                            ai = 0;
                            for (j = 1; j < this.group_size; j++) {
                                a2 = V.get(x, y, ix + j);
                                if (a2 > a) {
                                    a = a2;
                                    ai = j;
                                }
                            }
                            V2.set(x, y, i, a);
                            this.switches[n] = ix + ai;
                            n++;
                        }
                    }
                }
            }
            this.out_act = V2;
            return this.out_act;
        };
        MaxoutLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = this.out_depth;
            V.dw = new Float64Array(V.w.length); // zero out gradient wrt data
            var i, chain_grad;
            // pass the gradient through the appropriate switch
            if (this.out_sx === 1 && this.out_sy === 1) {
                for (i = 0; i < N; i++) {
                    chain_grad = V2.dw[i];
                    V.dw[this.switches[i]] = chain_grad;
                }
            }
            else {
                // bleh okay, lets do this the hard way
                var n = 0; // counter for switches
                for (var x = 0; x < V2.sx; x++) {
                    for (var y = 0; y < V2.sy; y++) {
                        for (i = 0; i < N; i++) {
                            chain_grad = V2.get_grad(x, y, i);
                            V.set_grad(x, y, this.switches[n], chain_grad);
                            n++;
                        }
                    }
                }
            }
        };
        MaxoutLayer.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.group_size = this.group_size;
            return _super.prototype.toJSON.call(this, json);
        };
        MaxoutLayer.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.group_size = json.group_size;
            this.switches = new Float64Array(this.group_size);
            return this;
        };
        return MaxoutLayer;
    }(LayerBase_1.LayerBase));
    exports.MaxoutLayer = MaxoutLayer;
});
//# sourceMappingURL=Maxout.js.map