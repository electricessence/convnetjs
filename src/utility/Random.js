(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Random;
    (function (Random) {
        // Random number utilities
        var return_v = false;
        var v_val = 0.0;
        function gaussRandom() {
            if (return_v) {
                //noinspection JSUnusedAssignment
                return_v = false;
                return v_val;
            }
            var u = 2 * Math.random() - 1;
            var v = 2 * Math.random() - 1;
            var r = u * u + v * v;
            if (r == 0 || r > 1)
                return gaussRandom();
            var c = Math.sqrt(-2 * Math.log(r) / r);
            v_val = v * c; // cache this
            return_v = true;
            return u * c;
        }
        Random.gaussRandom = gaussRandom;
        function float(min, boundary) {
            return Math.random() * (boundary - min) + min;
        }
        Random.float = float;
        function integer(min, boundary) {
            return Math.floor(Math.random() * (boundary - min) + min);
        }
        Random.integer = integer;
        function n(mu, std) {
            return mu + gaussRandom() * std;
        }
        Random.n = n;
        /**
         * create random permutation of numbers, in range [0...n-1]
         * @param n
         * @returns {number[]}
         */
        function set(n) {
            var i = n, j = 0, temp;
            var array = [];
            for (var q = 0; q < n; q++)
                array[q] = q;
            while (i--) {
                j = Math.floor(Math.random() * (i + 1));
                temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }
        Random.set = set;
        /**
         * sample from list lst according to probabilities in list probs
         * the two lists are of same size, and probs adds up to 1
         * @param list
         * @param probs
         * @returns {number}
         */
        function weightedSample(list, probs) {
            var p = float(0, 1.0);
            var cumprob = 0.0;
            var k = 0;
            var n = list.length;
            for (; k < n; k++) {
                cumprob += probs[k];
                if (p < cumprob) {
                    return list[k];
                }
            }
            // Shouldn't happen?
            return NaN;
        }
        Random.weightedSample = weightedSample;
    })(Random = exports.Random || (exports.Random = {}));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Random;
});
//# sourceMappingURL=Random.js.map