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
        define(["require", "exports", "./LayerBase"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase_1 = require("./LayerBase");
    /**
     * a bit experimental layer for now. I think it works but I'm not 100%
     * the gradient check is a bit funky. I'll look into this a bit later.
     * Local Response Normalization in window, along depths of volumes
     */
    var LocalResponseNormalizationLayer = (function (_super) {
        __extends(LocalResponseNormalizationLayer, _super);
        function LocalResponseNormalizationLayer(opt) {
            var in_sx = opt.in_sx, in_sy = opt.in_sy, in_depth = opt.in_depth;
            _super.call(this, 'lrn', in_sx, in_sy, in_depth);
            // required
            this.k = opt.k;
            this.n = opt.n;
            this.alpha = opt.alpha;
            this.beta = opt.beta;
            // checks
            if (this.n % 2 === 0) {
                console.warn('WARNING n should be odd for LRN layer');
            }
        }
        LocalResponseNormalizationLayer.prototype.forward = function (V) {
            this.in_act = V;
            var A = V.cloneAndZero();
            this._cache = V.cloneAndZero();
            var n2 = Math.floor(this.n / 2);
            for (var x = 0; x < V.sx; x++) {
                for (var y = 0; y < V.sy; y++) {
                    for (var i = 0; i < V.depth; i++) {
                        var ai = V.get(x, y, i);
                        // normalize in a window of size n
                        var den = 0.0;
                        for (var j = Math.max(0, i - n2); j <= Math.min(i + n2, V.depth - 1); j++) {
                            var aa = V.get(x, y, j);
                            den += aa * aa;
                        }
                        den *= this.alpha / this.n;
                        den += this.k;
                        this._cache.set(x, y, i, den); // will be useful for back-prop
                        den = Math.pow(den, this.beta);
                        A.set(x, y, i, ai / den);
                    }
                }
            }
            this.out_act = A;
            return this.out_act; // dummy identity function for now
        };
        LocalResponseNormalizationLayer.prototype.backward = function () {
            if (!this.in_act || !this.out_act)
                throw "Propagating in wrong order.";
            // evaluate gradient wrt data
            var V = this.in_act; // we need to set dw of this
            V.dw = new Float64Array(V.w.length); // zero out gradient wrt data
            // let A = this.out_act; // computed in forward pass
            var n2 = Math.floor(this.n / 2);
            for (var x = 0; x < V.sx; x++) {
                for (var y = 0; y < V.sy; y++) {
                    for (var i = 0; i < V.depth; i++) {
                        var chain_grad = this.out_act.get_grad(x, y, i);
                        var S = this._cache.get(x, y, i);
                        var SB = Math.pow(S, this.beta);
                        var SB2 = SB * SB;
                        // normalize in a window of size n
                        for (var j = Math.max(0, i - n2); j <= Math.min(i + n2, V.depth - 1); j++) {
                            var aj = V.get(x, y, j);
                            var g = -aj * this.beta * Math.pow(S, this.beta - 1) * this.alpha / this.n * 2 * aj;
                            if (j === i)
                                g += SB;
                            g /= SB2;
                            g *= chain_grad;
                            V.add_grad(x, y, j, g);
                        }
                    }
                }
            }
        };
        LocalResponseNormalizationLayer.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.k = this.k;
            json.n = this.n;
            json.alpha = this.alpha;
            json.beta = this.beta;
            return _super.prototype.toJSON.call(this, json);
        };
        LocalResponseNormalizationLayer.prototype.fromJSON = function (json) {
            _super.prototype.fromJSON.call(this, json);
            this.k = json.k;
            this.n = json.n;
            this.alpha = json.alpha;
            this.beta = json.beta;
            return this;
        };
        return LocalResponseNormalizationLayer;
    }(LayerBase_1.LayerBase));
    exports.LocalResponseNormalizationLayer = LocalResponseNormalizationLayer;
});
//# sourceMappingURL=LocalResponseNormalization.js.map