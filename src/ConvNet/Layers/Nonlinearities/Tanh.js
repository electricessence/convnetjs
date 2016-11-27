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
     * Implements Tanh non-linearity element-wise
     * x -> tanh(x)
     * so the output is between -1 and 1.
     */
    var TanhLayer = (function (_super) {
        __extends(TanhLayer, _super);
        function TanhLayer(options) {
            if (options === void 0) { options = {}; }
            _super.call(this, LayerType_1.LayerType.Tanh, options);
        }
        TanhLayer.prototype.forward = function (V) {
            this.in_act = V;
            var V2 = V.cloneAndZero();
            var N = V.w.length;
            for (var i = 0; i < N; i++) {
                V2.w[i] = tanh(V.w[i]);
            }
            this.out_act = V2;
            return this.out_act;
        };
        TanhLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act; // we need to set dw of this
            var V2 = this.out_act;
            var N = V.w.length;
            V.dw = new Float64Array(N); // zero out gradient wrt data
            for (var i = 0; i < N; i++) {
                var v2wi = V2.w[i];
                V.dw[i] = (1.0 - v2wi * v2wi) * V2.dw[i];
            }
        };
        return TanhLayer;
    }(LayerBase_1.BasicLayerBase));
    exports.TanhLayer = TanhLayer;
    // a helper function, since tanh is not yet part of ECMAScript. Will be in v6.
    function tanh(x) {
        var y = Math.exp(2 * x);
        return (y - 1) / (y + 1);
    }
});
//# sourceMappingURL=Tanh.js.map