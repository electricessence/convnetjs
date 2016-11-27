(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "../../src/ConvNet/Layers/DotProducts/ConvLayer", "../../src/ConvNet/Vol"], factory);
    }
})(function (require, exports) {
    "use strict";
    var ConvLayer_1 = require("../../src/ConvNet/Layers/DotProducts/ConvLayer");
    var Vol_1 = require("../../src/ConvNet/Vol");
    function logEvent(str) {
        console.log(str);
        var d = document.createElement('div');
        d.innerHTML = str;
        document.getElementById('result').appendChild(d);
    }
    var n = 0;
    var dtall = 0;
    var layer, x;
    function runExample() {
        var t0 = +new Date();
        layer.forward(x);
        //layer.backward();
        var t1 = +new Date();
        var diff = t1 - t0;
        dtall += diff;
        n++;
        logEvent('ran example ' + n + ' in ' + diff + 'ms, estimated average = ' + (dtall / n).toFixed(3) + 'ms');
    }
    var run1i = 0;
    function start() {
        // Conv LayerDefinition definition used in ConvNet benchmarks
        layer = new ConvLayer_1.ConvLayer({ in_sx: 128, in_sy: 128, in_depth: 3, sx: 11, filters: 96, stride: 1, pad: 0 });
        x = new Vol_1.Vol(128, 128, 3);
        run1i = window.setInterval(runExample, 5); // start
    }
    exports.start = start;
    function stop() {
        window.clearInterval(run1i);
    }
    exports.stop = stop;
});
//# sourceMappingURL=speedtest.js.map