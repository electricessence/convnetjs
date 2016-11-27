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
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var LayerBase = (function () {
        function LayerBase(layer_type, out_sx, out_sy, out_depth) {
            this.layer_type = layer_type;
            this.out_sx = out_sx;
            this.out_sy = out_sy;
            this.out_depth = out_depth;
        }
        LayerBase.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            json.out_depth = this.out_depth;
            json.out_sx = this.out_sx;
            json.out_sy = this.out_sy;
            json.layer_type = this.layer_type;
            return json;
        };
        LayerBase.prototype.fromJSON = function (json) {
            if (json.layer_type != this.layer_type)
                throw "You cannot import values from a different layer type.";
            // this.layer_type = json.layer_type;
            this.out_depth = json.out_depth;
            this.out_sx = json.out_sx;
            this.out_sy = json.out_sy;
            return this;
        };
        //noinspection JSMethodCanBeStatic
        LayerBase.prototype.getParamsAndGrads = function () {
            return [];
        };
        return LayerBase;
    }());
    exports.LayerBase = LayerBase;
    var BasicLayerBase = (function (_super) {
        __extends(BasicLayerBase, _super);
        function BasicLayerBase(layer_type, opt) {
            var in_sx = opt.in_sx, in_sy = opt.in_sy, in_depth = opt.in_depth;
            _super.call(this, layer_type, in_sx, in_sy, in_depth);
        }
        return BasicLayerBase;
    }(LayerBase));
    exports.BasicLayerBase = BasicLayerBase;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = LayerBase;
});
//# sourceMappingURL=LayerBase.js.map