(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "typescript-dotnet-umd/System/Collections/MapUtility", "typescript-dotnet-umd/System/Diagnostics/Stopwatch"], factory);
    }
})(function (require, exports) {
    "use strict";
    var MapUtility_1 = require("typescript-dotnet-umd/System/Collections/MapUtility");
    var Stopwatch_1 = require("typescript-dotnet-umd/System/Diagnostics/Stopwatch");
    var Trainer = (function () {
        function Trainer(net, options) {
            if (options === void 0) { options = {}; }
            this.net = net;
            options = MapUtility_1.merge(Trainer.OptionsDefaults, options);
            MapUtility_1.trim(options, Trainer.OptionsDefaults);
            MapUtility_1.apply(this, options);
            this.k = 0; // iteration counter
            this.gsum = []; // last iteration gradients (used for momentum calculations)
            this.xsum = []; // used in adam or adadelta
            // check if regression is expected
            this.regression = this.net.layers[this.net.layers.length - 1].layer_type === "regression";
        }
        Trainer.prototype.train = function (x, y) {
            var _this = this;
            var fwd_time = Stopwatch_1.default.measure(function () {
                _this.net.forward(x, true);
            }).milliseconds;
            var cost_loss = 0; // also set the flag that lets the net know we're just training
            var bwd_time = Stopwatch_1.default.measure(function () {
                cost_loss = _this.net.backward(y);
            }).milliseconds;
            if (this.regression && (y instanceof Array || y instanceof Float64Array))
                console.log("Warning: a regression net requires an array as training output vector.");
            var i;
            var l2_decay_loss = 0.0, l1_decay_loss = 0.0;
            this.k++;
            if (this.k % this.batch_size === 0) {
                var pglist = this.net.getParamsAndGrads();
                // initialize lists for accumulators. Will only be done once on first iteration
                if (this.gsum.length === 0 && (this.method !== Trainer.Method.SGD || this.momentum > 0.0)) {
                    // only vanilla sgd doesn't need either lists
                    // momentum needs gsum
                    // adagrad needs gsum
                    // adam and adadelta needs gsum and xsum
                    for (i = 0; i < pglist.length; i++) {
                        this.gsum.push(new Float64Array(pglist[i].params.length));
                        if (this.method === Trainer.Method.Adam || this.method === Trainer.Method.ADADelta) {
                            this.xsum.push(new Float64Array(pglist[i].params.length));
                        }
                        else {
                            this.xsum.push(new Float64Array(0)); // conserve memory
                        }
                    }
                }
                var dx = void 0;
                // perform an update for all sets of weights
                for (i = 0; i < pglist.length; i++) {
                    var pg = pglist[i]; // param, gradient, other options in future (custom learning rate etc)
                    var p = pg.params;
                    var g = pg.grads;
                    // learning rate for some parameters.
                    var l2_decay_mul = typeof pg.l2_decay_mul !== 'undefined' ? pg.l2_decay_mul : 1.0;
                    var l1_decay_mul = typeof pg.l1_decay_mul !== 'undefined' ? pg.l1_decay_mul : 1.0;
                    var l2_decay = this.l2_decay * l2_decay_mul;
                    var l1_decay = this.l1_decay * l1_decay_mul;
                    for (var j = 0, pLen = p.length; j < pLen; j++) {
                        l2_decay_loss += l2_decay * p[j] * p[j] / 2; // accumulate weight decay loss
                        l1_decay_loss += l1_decay * Math.abs(p[j]);
                        var l1grad = l1_decay * (p[j] > 0 ? 1 : -1);
                        var l2grad = l2_decay * (p[j]);
                        var gij = (l2grad + l1grad + g[j]) / this.batch_size; // raw batch gradient
                        var gsumi = this.gsum[i];
                        var xsumi = this.xsum[i];
                        if (this.method === Trainer.Method.Adam) {
                            // adam update
                            gsumi[j] = gsumi[j] * this.beta1 + (1 - this.beta1) * gij; // update biased first moment estimate
                            xsumi[j] = xsumi[j] * this.beta2 + (1 - this.beta2) * gij * gij; // update biased second moment estimate
                            var biasCorr1 = gsumi[j] * (1 - Math.pow(this.beta1, this.k)); // correct bias first moment estimate
                            var biasCorr2 = xsumi[j] * (1 - Math.pow(this.beta2, this.k)); // correct bias second moment estimate
                            dx = -this.learning_rate * biasCorr1 / (Math.sqrt(biasCorr2) + this.eps);
                            p[j] += dx;
                        }
                        else if (this.method === Trainer.Method.ADAGrad) {
                            // adagrad update
                            gsumi[j] = gsumi[j] + gij * gij;
                            dx = -this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij;
                            p[j] += dx;
                        }
                        else if (this.method === Trainer.Method.WindowGrad) {
                            // this is adagrad but with a moving window weighted average
                            // so the gradient is not accumulated over the entire history of the run.
                            // it's also referred to as Idea #1 in Zeiler paper on Adadelta. Seems reasonable to me!
                            gsumi[j] = this.ro * gsumi[j] + (1 - this.ro) * gij * gij;
                            dx = -this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij; // eps added for better conditioning
                            p[j] += dx;
                        }
                        else if (this.method === Trainer.Method.ADADelta) {
                            gsumi[j] = this.ro * gsumi[j] + (1 - this.ro) * gij * gij;
                            dx = -Math.sqrt((xsumi[j] + this.eps) / (gsumi[j] + this.eps)) * gij;
                            xsumi[j] = this.ro * xsumi[j] + (1 - this.ro) * dx * dx; // yes, xsum lags behind gsum by 1.
                            p[j] += dx;
                        }
                        else if (this.method === Trainer.Method.Nesterov) {
                            dx = gsumi[j];
                            gsumi[j] = gsumi[j] * this.momentum + this.learning_rate * gij;
                            dx = this.momentum * dx - (1.0 + this.momentum) * gsumi[j];
                            p[j] += dx;
                        }
                        else {
                            // assume SGD
                            if (this.momentum > 0.0) {
                                // momentum update
                                dx = this.momentum * gsumi[j] - this.learning_rate * gij; // step
                                gsumi[j] = dx; // back this up for next iteration of momentum
                                p[j] += dx; // apply corrected gradient
                            }
                            else {
                                // vanilla sgd
                                p[j] += -this.learning_rate * gij;
                            }
                        }
                        g[j] = 0.0; // zero out gradient so that we can begin accumulating anew
                    }
                }
            }
            // appending softmax_loss for backwards compatibility, but from now on we will always use cost_loss
            // in future, TODO: have to completely redo the way loss is done around the network as currently
            // loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
            // and it should all be computed correctly and automatically.
            return {
                fwd_time: fwd_time,
                bwd_time: bwd_time,
                l2_decay_loss: l2_decay_loss,
                l1_decay_loss: l1_decay_loss,
                cost_loss: cost_loss,
                softmax_loss: cost_loss,
                loss: cost_loss + l1_decay_loss + l2_decay_loss
            };
        };
        return Trainer;
    }());
    exports.Trainer = Trainer;
    var Trainer;
    (function (Trainer) {
        var Method;
        (function (Method) {
            Method.Adam = 'adam';
            Method.ADADelta = 'adadelta';
            Method.SGD = 'sgd';
            Method.ADAGrad = 'adagrad';
            Method.WindowGrad = 'windowgrad';
            Method.Nesterov = 'nesterov';
        })(Method = Trainer.Method || (Trainer.Method = {}));
        Trainer.OptionsDefaults = Object.freeze({
            learning_rate: 0.01,
            l1_decay: 0,
            l2_decay: 0,
            batch_size: 1,
            method: Method.SGD,
            momentum: 0.9,
            ro: 0.95,
            eps: 1e-8,
            beta1: 0.9,
            beta2: 0.999
        });
    })(Trainer = exports.Trainer || (exports.Trainer = {}));
});
//# sourceMappingURL=Trainer.js.map