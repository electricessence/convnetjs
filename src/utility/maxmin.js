(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    /**
     * returns min, max and indices of an array
     * @param w
     * @returns {{}}
     */
    function maxmin(w) {
        if (w.length === 0) {
            return {};
        } // ... ;s
        var maxv = w[0];
        var minv = w[0];
        var maxi = 0;
        var mini = 0;
        for (var i = 1; i < w.length; i++) {
            if (w[i] > maxv) {
                maxv = w[i];
                maxi = i;
            }
            if (w[i] < minv) {
                minv = w[i];
                mini = i;
            }
        }
        return { maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv: maxv - minv };
    }
    exports.maxmin = maxmin;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = maxmin;
});
//# sourceMappingURL=maxmin.js.map