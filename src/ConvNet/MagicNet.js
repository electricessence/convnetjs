(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "../utility/Random", "./LayerType", "typescript-dotnet-umd/System/Collections/Array/Utility", "./Net", "typescript-dotnet-umd/System/Collections/MapUtility", "./Trainer", "../utility/maxmin"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Random_1 = require("../utility/Random");
    var LayerType_1 = require("./LayerType");
    var Utility_1 = require("typescript-dotnet-umd/System/Collections/Array/Utility");
    var Net_1 = require("./Net");
    var MapUtility_1 = require("typescript-dotnet-umd/System/Collections/MapUtility");
    var Trainer_1 = require("./Trainer");
    var maxmin_1 = require("../utility/maxmin");
    /**
     * A MagicNet takes data: a list of convnetjs.Vol(), and labels
     * which for now are assumed to be class indices 0..K. MagicNet then:
     * - creates data folds for cross-validation
     * - samples candidate networks
     * - evaluates candidate networks on all data folds
     * - produces predictions by model-averaging the best networks
     */
    var MagicNet = (function () {
        function MagicNet(data, labels, opt) {
            if (data === void 0) { data = []; }
            if (labels === void 0) { labels = []; }
            this.data = data;
            this.labels = labels;
            opt = MapUtility_1.merge(MagicNet.OptionsDefaults, opt);
            MapUtility_1.trim(opt, MagicNet.OptionsDefaults);
            MapUtility_1.apply(this, opt);
            // computed
            this.folds = []; // data fold indices, gets filled by sampleFolds()
            this.candidates = []; // candidate networks that are being currently evaluated
            this.evaluated_candidates = []; // history of all candidates that were fully evaluated on all folds
            this.unique_labels = Utility_1.distinct(labels);
            this.iter = 0; // iteration counter, goes from 0 -> num_epochs * num_training_data
            this.foldix = 0; // index of active fold
            // callbacks
            this.finish_fold_callback = null;
            this.finish_batch_callback = null;
            // initializations
            if (this.data.length) {
                this.sampleFolds();
                this.sampleCandidates();
            }
        }
        // sets this.folds to a sampling of this.num_folds folds
        MagicNet.prototype.sampleFolds = function () {
            var N = this.data.length;
            var num_train = Math.floor(this.train_ratio * N);
            this.folds = []; // flush folds, if any
            for (var i = 0; i < this.num_folds; i++) {
                var p = Random_1.Random.set(N);
                this.folds.push({ train_ix: p.slice(0, num_train), test_ix: p.slice(num_train, N) });
            }
        };
        // returns a random candidate network
        MagicNet.prototype.sampleCandidate = function () {
            var input_depth = this.data[0].w.length;
            var num_classes = this.unique_labels.length;
            // sample network topology and hyper-parameters
            var layer_defs = [];
            layer_defs.push({ type: 'input', out_sx: 1, out_sy: 1, out_depth: input_depth });
            var nl = Random_1.Random.weightedSample([0, 1, 2, 3], [0.2, 0.3, 0.3, 0.2]); // prefer nets with 1,2 hidden layers
            for (var q = 0; q < nl; q++) {
                var ni = Random_1.Random.integer(this.neurons_min, this.neurons_max);
                var act = [LayerType_1.LayerType.Tanh, LayerType_1.LayerType.Maxout, LayerType_1.LayerType.Relu][Random_1.Random.integer(0, 3)];
                if (Random_1.Random.float(0, 1) < 0.5) {
                    var dp = Math.random();
                    layer_defs.push({
                        type: LayerType_1.LayerType.FC,
                        num_neurons: ni,
                        activation: act,
                        drop_prob: dp
                    });
                }
                else {
                    layer_defs.push({ type: LayerType_1.LayerType.FC, num_neurons: ni, activation: act });
                }
            }
            layer_defs.push({ type: LayerType_1.LayerType.Softmax, num_classes: num_classes });
            var net = new Net_1.Net();
            net.makeLayers(layer_defs);
            // sample training hyper-parameters
            var bs = Random_1.Random.integer(this.batch_size_min, this.batch_size_max); // batch size
            var l2 = Math.pow(10, Random_1.Random.float(this.l2_decay_min, this.l2_decay_max)); // l2 weight decay
            var lr = Math.pow(10, Random_1.Random.float(this.learning_rate_min, this.learning_rate_max)); // learning rate
            var mom = Random_1.Random.float(this.momentum_min, this.momentum_max); // momentum. Lets just use 0.9, works okay usually ;p
            var tp = Random_1.Random.float(0, 1); // trainer type
            var trainer_def;
            if (tp < 0.33) {
                trainer_def = { method: Trainer_1.Trainer.Method.ADADelta, batch_size: bs, l2_decay: l2 };
            }
            else if (tp < 0.66) {
                trainer_def = {
                    method: Trainer_1.Trainer.Method.ADAGrad,
                    learning_rate: lr,
                    batch_size: bs,
                    l2_decay: l2
                };
            }
            else {
                trainer_def = {
                    method: Trainer_1.Trainer.Method.SGD,
                    learning_rate: lr,
                    momentum: mom,
                    batch_size: bs,
                    l2_decay: l2
                };
            }
            var trainer = new Trainer_1.Trainer(net, trainer_def);
            return {
                acc: [],
                accv: 0,
                layer_defs: layer_defs,
                trainer_def: trainer_def,
                net: net,
                trainer: trainer,
            };
        };
        // sets this.candidates with this.num_candidates candidate nets
        MagicNet.prototype.sampleCandidates = function () {
            this.candidates = []; // flush, if any
            for (var i = 0; i < this.num_candidates; i++) {
                this.candidates.push(this.sampleCandidate());
            }
        };
        MagicNet.prototype.step = function () {
            var c;
            var k;
            // run an example through current candidate
            this.iter++;
            // step all candidates on a random data point
            var fold = this.folds[this.foldix]; // active fold
            var dataix = fold.train_ix[Random_1.Random.integer(0, fold.train_ix.length)];
            for (k = 0; k < this.candidates.length; k++) {
                var x = this.data[dataix];
                var l = this.labels[dataix];
                this.candidates[k].trainer.train(x, l);
            }
            // process consequences: sample new folds, or candidates
            var lastiter = this.num_epochs * fold.train_ix.length;
            if (this.iter >= lastiter) {
                // finished evaluation of this fold. Get final validation
                // accuracies, record them, and go on to next fold.
                var val_acc = this.evalValErrors();
                for (k = 0; k < this.candidates.length; k++) {
                    c = this.candidates[k];
                    c.acc.push(val_acc[k]);
                    c.accv += val_acc[k];
                }
                this.iter = 0; // reset step number
                this.foldix++; // increment fold
                if (this.finish_fold_callback !== null) {
                    this.finish_fold_callback();
                }
                if (this.foldix >= this.folds.length) {
                    // we finished all folds as well! Record these candidates
                    // and sample new ones to evaluate.
                    for (k = 0; k < this.candidates.length; k++) {
                        this.evaluated_candidates.push(this.candidates[k]);
                    }
                    // sort evaluated candidates according to accuracy achieved
                    this.evaluated_candidates.sort(function (a, b) {
                        return (a.accv / a.acc.length)
                            > (b.accv / b.acc.length)
                            ? -1 : 1;
                    });
                    // and clip only to the top few ones (lets place limit at 3*ensemble_size)
                    // otherwise there are concerns with keeping these all in memory
                    // if MagicNet is being evaluated for a very long time
                    if (this.evaluated_candidates.length > 3 * this.ensemble_size) {
                        this.evaluated_candidates
                            = this.evaluated_candidates.slice(0, 3 * this.ensemble_size);
                    }
                    if (this.finish_batch_callback !== null) {
                        this.finish_batch_callback();
                    }
                    this.sampleCandidates(); // begin with new candidates
                    this.foldix = 0; // reset this
                }
                else {
                    // we will go on to another fold. reset all candidates nets
                    for (k = 0; k < this.candidates.length; k++) {
                        c = this.candidates[k];
                        var net_1 = new Net_1.Net();
                        net_1.makeLayers(c.layer_defs);
                        var trainer_1 = new Trainer_1.Trainer(net_1, c.trainer_def);
                        c.net = net_1;
                        c.trainer = trainer_1;
                    }
                }
            }
        };
        MagicNet.prototype.evalValErrors = function () {
            // evaluate candidates on validation data and return performance of current networks
            // as simple list
            var vals = [];
            var fold = this.folds[this.foldix]; // active fold
            for (var k = 0; k < this.candidates.length; k++) {
                var net_2 = this.candidates[k].net;
                var v = 0.0;
                for (var q = 0; q < fold.test_ix.length; q++) {
                    var x = this.data[fold.test_ix[q]];
                    var l = this.labels[fold.test_ix[q]];
                    net_2.forward(x);
                    var yhat = net_2.getPrediction();
                    v += (yhat === l ? 1.0 : 0.0); // 0 1 loss
                }
                v /= fold.test_ix.length; // normalize
                vals.push(v);
            }
            return vals;
        };
        // returns prediction scores for given test data point, as Vol
        // uses an averaged prediction from the best ensemble_size models
        // x is a Vol.
        MagicNet.prototype.predict_soft = function (data) {
            // forward prop the best networks
            // and accumulate probabilities at last layer into a an output Vol
            var eval_candidates = [];
            var nv = 0;
            if (this.evaluated_candidates.length === 0) {
                // not sure what to do here, first batch of nets hasn't evaluated yet
                // lets just predict with current candidates.
                nv = this.candidates.length;
                eval_candidates = this.candidates;
            }
            else {
                // forward prop the best networks from evaluated_candidates
                nv = Math.min(this.ensemble_size, this.evaluated_candidates.length);
                eval_candidates = this.evaluated_candidates;
            }
            // forward nets of all candidates and average the predictions
            var xout, n = 0, d;
            for (var j = 0; j < nv; j++) {
                var net_3 = eval_candidates[j].net;
                var x = net_3.forward(data);
                if (j === 0) {
                    xout = x;
                    n = x.w.length;
                }
                else {
                    // add it on
                    for (d = 0; d < n; d++) {
                        //noinspection JSUnusedAssignment
                        xout.w[d] += x.w[d];
                    }
                }
            }
            // produce average
            for (d = 0; d < n; d++) {
                xout.w[d] /= nv;
            }
            return xout;
        };
        MagicNet.prototype.predict = function (data) {
            var predicted_label;
            var xout = this.predict_soft(data);
            if (xout.w.length !== 0) {
                var stats = maxmin_1.maxmin(xout.w);
                predicted_label = stats.maxi;
            }
            else {
                predicted_label = -1; // error out
            }
            return predicted_label;
        };
        MagicNet.prototype.toJSON = function (json) {
            if (json === void 0) { json = {}; }
            var eval_candidates = this.evaluated_candidates;
            // dump the top ensemble_size networks as a list
            var nv = Math.min(this.ensemble_size, eval_candidates.length);
            var nets = Utility_1.initialize(nv);
            json.nets = nets;
            for (var i = 0; i < nv; i++) {
                nets[i] = eval_candidates[i].net.toJSON();
            }
            return json;
        };
        MagicNet.prototype.fromJSON = function (json) {
            var len = this.ensemble_size = json.nets.length;
            this.evaluated_candidates = Utility_1.initialize(len);
            for (var i = 0; i < len; i++) {
                var net_4 = new Net_1.Net();
                net_4.fromJSON(json.nets[i]);
                this.evaluated_candidates[i] = { net: net_4 };
            }
            return this;
        };
        // callback functions
        // called when a fold is finished, while evaluating a batch
        MagicNet.prototype.onFinishFold = function (f) { this.finish_fold_callback = f; };
        // called when a batch of candidates has finished evaluating
        MagicNet.prototype.onFinishBatch = function (f) { this.finish_batch_callback = f; };
        return MagicNet;
    }());
    exports.MagicNet = MagicNet;
    var MagicNet;
    (function (MagicNet) {
        MagicNet.OptionsDefaults = Object.freeze({
            train_ratio: 0.7,
            num_folds: 10,
            num_candidates: 50,
            num_epochs: 50,
            // number of best models to average during prediction. Usually higher = better
            ensemble_size: 10,
            // candidate parameters
            batch_size_min: 10,
            batch_size_max: 300,
            l2_decay_min: -4,
            l2_decay_max: 2,
            learning_rate_min: -4,
            learning_rate_max: 0,
            momentum_min: 0.9,
            momentum_max: 0.9,
            neurons_min: 5,
            neurons_max: 30
        });
    })(MagicNet = exports.MagicNet || (exports.MagicNet = {}));
});
//# sourceMappingURL=MagicNet.js.map