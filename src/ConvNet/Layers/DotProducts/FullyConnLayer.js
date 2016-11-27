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
    var FullyConnLayer = (function (_super) {
        __extends(FullyConnLayer, _super);
        function FullyConnLayer(options) {
            if (options === void 0) { options = {}; }
            var in_sx = options.in_sx, in_sy = options.in_sy, in_depth = options.in_depth, num_neurons = options.num_neurons, filters = options.filters;
            // note we are doing floor, so if the strided convolution of the filter doesn't fit into the input
            // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
            // final application.
            _super.call(this, LayerType_1.LayerType.FC, 1, 1, typeof num_neurons !== 'undefined' ? num_neurons : filters, options);
            this.in_depth = in_depth;
            this.in_sx = in_sx;
            this.in_sy = in_sy;
            // computed
            var ni = in_sx * in_sy * in_depth;
            this.num_inputs = ni;
            // initializations
            for (var i = 0; i < this.out_depth; i++) {
                this.filters.push(new Vol_1.Vol(1, 1, ni));
            }
        }
        FullyConnLayer.prototype.forward = function (V) {
            this.in_act = V;
            var A = new Vol_1.Vol(1, 1, this.out_depth, 0.0);
            var Vw = V.w;
            for (var i = 0; i < this.out_depth; i++) {
                var a = 0.0;
                var wi = this.filters[i].w;
                for (var d = 0; d < this.num_inputs; d++) {
                    a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
                }
                a += this.biases.w[i];
                A.w[i] = a;
            }
            this.out_act = A;
            return this.out_act;
        };
        FullyConnLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act;
            V.dw = new Float64Array(V.w.length); // zero out the gradient in input Vol
            // compute gradient wrt weights and data
            for (var i = 0; i < this.out_depth; i++) {
                var tfi = this.filters[i];
                var chain_grad = this.out_act.dw[i];
                for (var d = 0; d < this.num_inputs; d++) {
                    V.dw[d] += tfi.w[d] * chain_grad; // grad wrt input data
                    tfi.dw[d] += V.w[d] * chain_grad; // grad wrt params
                }
                this.biases.dw[i] += chain_grad;
            }
        };
        FullyConnLayer.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.num_inputs = this.num_inputs;
            return _super.prototype.toJSON.call(this, json);
        };
        FullyConnLayer.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.num_inputs = json.num_inputs;
            return this;
        };
        return FullyConnLayer;
    }(ConvLayerBase_1.ConvLayerBase));
    exports.FullyConnLayer = FullyConnLayer;
});
//# sourceMappingURL=FullyConnLayer.js.map