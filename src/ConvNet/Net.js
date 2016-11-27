(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "../utility/assert", "./Layers/index", "typescript-dotnet-umd/System/Collections/Array/Utility"], factory);
    }
})(function (require, exports) {
    "use strict";
    var assert_1 = require("../utility/assert");
    var index_1 = require("./Layers/index");
    var Utility_1 = require("typescript-dotnet-umd/System/Collections/Array/Utility");
    /**
     * Net manages a set of layers
     * For now constraints: Simple linear order of layers, first layer input last layer a cost layer
     */
    var Net = (function () {
        function Net() {
            this.layers = [];
        }
        // takes a list of layer definitions and creates the network layer objects
        Net.prototype.makeLayers = function (defs) {
            // few checks
            assert_1.assert(defs.length >= 2, 'Error! At least one input layer and one loss layer are required.');
            assert_1.assert(defs[0].type === 'input', 'Error! First layer must be the input layer, to declare size of inputs');
            // desugar layer_defs for adding activation, dropout layers etc
            defs = desugar(defs);
            // create the layers
            this.layers = [];
            for (var i = 0; i < defs.length; i++) {
                var def = defs[i];
                if (i > 0) {
                    var prev = this.layers[i - 1];
                    def.in_sx = prev.out_sx;
                    def.in_sy = prev.out_sy;
                    def.in_depth = prev.out_depth;
                }
                this.layers.push(index_1.newFromType(def));
            }
        };
        Net.prototype.getCostLoss = function (V, y) {
            this.forward(V, false);
            var N = this.layers.length;
            return this.layers[N - 1].backward(y);
        };
        // forward prop the network.
        // The trainer class passes is_training = true, but when this function is
        // called from outside (not from the trainer), it defaults to prediction mode
        Net.prototype.forward = function (V, is_training) {
            if (is_training === void 0) { is_training = false; }
            var act = this.layers[0].forward(V, is_training);
            for (var i = 1; i < this.layers.length; i++) {
                act = this.layers[i].forward(act, is_training);
            }
            return act;
        };
        // back-prop: compute gradients wrt all parameters
        Net.prototype.backward = function (y) {
            var N = this.layers.length;
            var loss = this.layers[N - 1].backward(y); // last layer assumed to be loss layer
            for (var i = N - 2; i >= 0; i--) {
                this.layers[i].backward();
            }
            return loss;
        };
        Net.prototype.getParamsAndGrads = function () {
            // accumulate parameters and gradients for the entire network
            var response = [];
            for (var _i = 0, _a = this.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                var pg = layer.getParamsAndGrads();
                for (var _b = 0, pg_1 = pg; _b < pg_1.length; _b++) {
                    var n = pg_1[_b];
                    response.push(n);
                }
            }
            return response;
        };
        Net.prototype.getPrediction = function () {
            // this is a convenience function for returning the argmax
            // prediction, assuming the last layer of the net is a softmax
            var lastLayer = this.layers[this.layers.length - 1];
            if (!lastLayer)
                throw "Empty entry in layers array.";
            assert_1.assert(lastLayer.layer_type === 'softmax', 'getPrediction function assumes softmax as last layer of the net!');
            if (!lastLayer.out_act)
                throw "out_act is not set.";
            var p = lastLayer.out_act.w;
            var maxv = p[0];
            var maxi = 0;
            for (var i = 1; i < p.length; i++) {
                if (p[i] > maxv) {
                    maxv = p[i];
                    maxi = i;
                }
            }
            return maxi; // return index of the class with highest class probability
        };
        Net.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            var layers = this.layers, newLayers = Utility_1.initialize(layers.length);
            json.layers = newLayers;
            for (var i = 0; i < this.layers.length; i++) {
                newLayers[i] = layers[i].toJSON();
            }
            return json;
        };
        Net.prototype.fromJSON = function (json) {
            this.layers = [];
            for (var i = 0; i < json.layers.length; i++) {
                var Lj = json.layers[i];
                this.layers.push(index_1.newFromType(Lj.layer_type, Lj));
            }
            return this;
        };
        return Net;
    }());
    exports.Net = Net;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Net;
    function desugar(defs) {
        var new_defs = [];
        for (var i = 0; i < defs.length; i++) {
            var def = defs[i];
            if (def.type === 'softmax' || def.type === 'svm') {
                // add an fc layer here, there is no reason the user should
                // have to worry about this and we almost always want to
                new_defs.push({ type: 'fc', num_neurons: def.num_classes });
            }
            if (def.type === 'regression') {
                // add an fc layer here, there is no reason the user should
                // have to worry about this and we almost always want to
                new_defs.push({ type: 'fc', num_neurons: def.num_neurons });
            }
            if ((def.type === 'fc' || def.type === 'conv')
                && typeof (def.bias_pref) === 'undefined') {
                def.bias_pref = 0.0;
                if (typeof def.activation !== 'undefined' && def.activation === 'relu') {
                    def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
                }
            }
            new_defs.push(def);
            if (typeof def.activation !== 'undefined') {
                if (def.activation === 'relu') {
                    new_defs.push({ type: 'relu' });
                }
                else if (def.activation === 'sigmoid') {
                    new_defs.push({ type: 'sigmoid' });
                }
                else if (def.activation === 'tanh') {
                    new_defs.push({ type: 'tanh' });
                }
                else if (def.activation === 'maxout') {
                    // create maxout activation, and pass along group size, if provided
                    var gs = typeof def.group_size !== 'undefined' ? def.group_size : 2;
                    new_defs.push({ type: 'maxout', group_size: gs });
                }
                else {
                    console.error('ERROR unsupported activation ' + def.activation);
                }
            }
            if (typeof def.drop_prob !== 'undefined' && def.type !== 'dropout') {
                new_defs.push({ type: 'dropout', drop_prob: def.drop_prob });
            }
        }
        return new_defs;
    }
});
//# sourceMappingURL=Net.js.map