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
        define(["require", "exports", "./LayerBase", "typescript-dotnet-umd/System/Collections/Array/Utility"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("./LayerBase");
    var Utility_1 = require("typescript-dotnet-umd/System/Collections/Array/Utility");
    /**
     * An inefficient dropout layer
     * Note this is not most efficient implementation since the layer before
     * computed all these activations and now we're just going to drop them :(
     * same goes for backward pass. Also, if we wanted to be efficient at test time
     * we could equivalently be clever and upscale during train and copy pointers during test
     * todo: make more efficient.
     */
    var DropoutLayer = (function (_super) {
        __extends(DropoutLayer, _super);
        function DropoutLayer(opt) {
            if (opt === void 0) { opt = {}; }
            var in_sx = opt.in_sx, in_sy = opt.in_sy, in_depth = opt.in_depth;
            _super.call(this, 'dropout', in_sx, in_sy, in_depth);
            this.drop_prob = typeof opt.drop_prob !== 'undefined' ? opt.drop_prob : 0.5;
            this.dropped = Utility_1.initialize(in_sx * in_sy * in_depth);
        }
        DropoutLayer.prototype.forward = function (V, is_training) {
            this.in_act = V;
            var V2 = V.clone();
            var N = V.w.length;
            var i;
            if (is_training) {
                // do dropout
                for (i = 0; i < N; i++) {
                    if (Math.random() < this.drop_prob) {
                        V2.w[i] = 0;
                        this.dropped[i] = true;
                    } // drop!
                    else {
                        this.dropped[i] = false;
                    }
                }
            }
            else {
                // scale the activations during prediction
                for (i = 0; i < N; i++) {
                    V2.w[i] *= this.drop_prob;
                }
            }
            this.out_act = V2;
            return this.out_act; // dummy identity function for now
        };
        DropoutLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            var V = this.in_act; // we need to set dw of this
            var chain_grad = this.out_act;
            var N = V.w.length;
            V.dw = new Float64Array(N);
            for (var i = 0; i < N; i++) {
                if (!(this.dropped[i])) {
                    V.dw[i] = chain_grad.dw[i]; // copy over the gradient
                }
            }
        };
        DropoutLayer.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.drop_prob = this.drop_prob;
            return _super.prototype.toJSON.call(this, json);
        };
        DropoutLayer.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.drop_prob = json.drop_prob;
            return this;
        };
        return DropoutLayer;
    }(LayerBase_1.LayerBase));
    exports.DropoutLayer = DropoutLayer;
});
//# sourceMappingURL=Dropout.js.map