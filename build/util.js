(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./utility/maxmin", "./utility/f2t"], factory);
    }
})(function (require, exports) {
    "use strict";
    /* contains various utility functions */
    var maxmin_1 = require("./utility/maxmin");
    exports.maxmin = maxmin_1.default;
    var f2t_1 = require("./utility/f2t");
    exports.f2t = f2t_1.default;
    /**
     * a window stores _size_ number of values
     * and returns averages. Useful for keeping running
     * track of validation or training accuracy during SGD
     */
    var Window = (function () {
        function Window(size, minsize) {
            if (size === void 0) { size = 100; }
            if (minsize === void 0) { minsize = 20; }
            this.size = size;
            this.minsize = minsize;
            this.reset();
        }
        Window.prototype.add = function (x) {
            var v = this.values;
            v.push(x);
            this.sum += x;
            if (v.length > this.size) {
                this.sum -= v.shift();
            }
        };
        Window.prototype.get_average = function () {
            var v = this.values;
            if (v.length < this.minsize)
                return -1;
            else
                return this.sum / v.length;
        };
        Window.prototype.reset = function () {
            this.values = [];
            this.sum = 0;
        };
        return Window;
    }());
    exports.Window = Window;
});
//# sourceMappingURL=util.js.map