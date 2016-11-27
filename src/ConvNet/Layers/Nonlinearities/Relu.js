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
     * Implements ReLU non-linearity element-wise
     * x -> max(0, x)
     * the output is in [0, inf)
     */
    var ReluLayer = (function (_super) {
        __extends(ReluLayer, _super);
        function ReluLayer(options) {
            if (options === void 0) { options = {}; }
            _super.call(this, LayerType_1.LayerType.Relu, options);
        }
        ReluLayer.prototype.forward = function (V) {
            this.in_act = V;
            var V2 = V.clone();
            var N = V.w.length;
            var V2w = V2.w;
            for (var i = 0; i < N; i++) {
                if (V2w[i] < 0)
                    V2w[i] = 0; // threshold at 0
            }
            this.out_act = V2;
            return this.out_act;
        };
        ReluLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = V.w.length;
            V.dw = new Float64Array(N); // zero out gradient wrt data
            for (var i = 0; i < N; i++) {
                if (V2.w[i] <= 0)
                    V.dw[i] = 0; // threshold
                else
                    V.dw[i] = V2.dw[i];
            }
        };
        return ReluLayer;
    }(LayerBase_1.BasicLayerBase));
    exports.ReluLayer = ReluLayer;
});
//# sourceMappingURL=Relu.js.map