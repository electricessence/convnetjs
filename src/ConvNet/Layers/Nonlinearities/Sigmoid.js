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
        define(["require", "exports", "../LayerBase", "../../LayerType"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("../LayerBase");
    var LayerType_1 = require("../../LayerType");
    /**
     * Implements Sigmoid non-linearity element-wise
     * x -> 1/(1+e^(-x))
     * so the output is between 0 and 1.
     */
    var SigmoidLayer = (function (_super) {
        __extends(SigmoidLayer, _super);
        function SigmoidLayer(options) {
            if (options === void 0) { options = {}; }
            _super.call(this, LayerType_1.LayerType.Sigmoid, options);
        }
        SigmoidLayer.prototype.forward = function (V) {
            this.in_act = V;
            var V2 = V.cloneAndZero();
            var N = V.w.length;
            var V2w = V2.w;
            var Vw = V.w;
            for (var i = 0; i < N; i++) {
                V2w[i] = 1.0 / (1.0 + Math.exp(-Vw[i]));
            }
            this.out_act = V2;
            return this.out_act;
        };
        SigmoidLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = V.w.length;
            V.dw = new Float64Array(N); // zero out gradient wrt data
            for (var i = 0; i < N; i++) {
                var v2wi = V2.w[i];
                V.dw[i] = v2wi * (1.0 - v2wi) * V2.dw[i];
            }
        };
        return SigmoidLayer;
    }(LayerBase_1.BasicLayerBase));
    exports.SigmoidLayer = SigmoidLayer;
});
//# sourceMappingURL=Sigmoid.js.map