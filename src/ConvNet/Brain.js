(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "./Net", "./index", "../utility/Random", "./Trainer", "typescript-dotnet-umd/System/Collections/Array/Utility", "./Vol"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Net_1 = require("./Net");
    var ConvNet = require("./index");
    var Random_1 = require("../utility/Random");
    var Trainer_1 = require("./Trainer");
    var Utility_1 = require("typescript-dotnet-umd/System/Collections/Array/Utility");
    var Vol_1 = require("./Vol");
    /**
     * An agent is in state0 and does action0
     * environment then assigns reward0 and provides new state, state1
     * Experience nodes store all this information, which is used in the
     * Q-learning update step
     */
    var Experience = (function () {
        function Experience(state0, action0, reward0, state1) {
            this.state0 = state0;
            this.action0 = action0;
            this.reward0 = reward0;
            this.state1 = state1;
        }
        return Experience;
    }());
    exports.Experience = Experience;
    /**
     * A Brain object does all the magic.
     * over time it receives some inputs and some rewards
     * and its job is to set the outputs to maximize the expected reward
     */
    var Brain = (function () {
        function Brain(num_states, num_actions, options) {
            if (options === void 0) { options = {}; }
            this.num_states = num_states;
            this.num_actions = num_actions;
            // in number of time steps, of temporal memory
            // the ACTUAL input to the net will be (x,a) temporal_window times, and followed by current x
            // so to have no information from previous time step going into value function, set to 0.
            this.temporal_window = typeof options.temporal_window !== 'undefined'
                ? options.temporal_window
                : 1;
            // size of experience replay memory
            this.experience_size = typeof options.experience_size !== 'undefined'
                ? options.experience_size
                : 30000;
            // number of examples in experience replay memory before we begin learning
            this.start_learn_threshold = typeof options.start_learn_threshold !== 'undefined'
                ? options.start_learn_threshold
                : Math.floor(Math.min(this.experience_size * 0.1, 1000));
            // gamma is a crucial parameter that controls how much plan-ahead the agent does. In [0,1]
            this.gamma = typeof options.gamma !== 'undefined' ? options.gamma : 0.8;
            // number of steps we will learn for
            this.learning_steps_total = typeof options.learning_steps_total !== 'undefined'
                ? options.learning_steps_total
                : 100000;
            // how many steps of the above to perform only random actions (in the beginning)?
            this.learning_steps_burnin = typeof options.learning_steps_burnin !== 'undefined'
                ? options.learning_steps_burnin
                : 3000;
            // what epsilon value do we bottom out on? 0.0 => purely deterministic policy at end
            this.epsilon_min = typeof options.epsilon_min !== 'undefined' ? options.epsilon_min : 0.05;
            // what epsilon to use at test time? (i.e. when learning is disabled)
            this.epsilon_test_time = typeof options.epsilon_test_time !== 'undefined'
                ? options.epsilon_test_time
                : 0.01;
            // advanced feature. Sometimes a random action should be biased towards some values
            // for example in flappy bird, we may want to choose to not flap more often
            if (typeof options.random_action_distribution !== 'undefined') {
                // this better sum to 1 by the way, and be of length this.num_actions
                this.random_action_distribution = options.random_action_distribution;
                if (this.random_action_distribution.length !== num_actions) {
                    console.warn('TROUBLE. random_action_distribution should be same length as num_actions.');
                }
                var a = this.random_action_distribution;
                var s = 0.0;
                for (var k = 0; k < a.length; k++) {
                    s += a[k];
                }
                if (Math.abs(s - 1.0) > 0.0001) {
                    console.warn('TROUBLE. random_action_distribution should sum to 1!');
                }
            }
            else {
                this.random_action_distribution = [];
            }
            // states that go into neural net to predict optimal action look as
            // x0,a0,x1,a1,x2,a2,...xt
            // this variable controls the size of that temporal window. Actions are
            // encoded as 1-of-k hot vectors
            this.net_inputs
                = num_states * this.temporal_window + num_actions * this.temporal_window + num_states;
            this.window_size = Math.max(this.temporal_window, 2); // must be at least 2, but if we want more context even more
            this.state_window = new Array(this.window_size);
            this.action_window = new Array(this.window_size);
            this.reward_window = new Array(this.window_size);
            this.net_window = new Array(this.window_size);
            // create [state -> value of all possible actions] modeling net for the value function
            var layer_defs = [];
            if (typeof options.layer_defs !== 'undefined') {
                // this is an advanced usage feature, because size of the input to the network, and number of
                // actions must check out. This is not very pretty Object Oriented programming but I can't see
                // a way out of it :(
                layer_defs = options.layer_defs;
                if (layer_defs.length < 2) {
                    console.warn('TROUBLE! must have at least 2 layers');
                }
                if (layer_defs[0].type !== 'input') {
                    console.warn('TROUBLE! first layer must be input layer!');
                }
                if (layer_defs[layer_defs.length - 1].type !== 'regression') {
                    console.warn('TROUBLE! last layer must be input regression!');
                }
                if (layer_defs[0].out_depth * layer_defs[0].out_sx * layer_defs[0].out_sy !== this.net_inputs) {
                    console.warn('TROUBLE! Number of inputs must be num_states * temporal_window + num_actions * temporal_window + num_states!');
                }
                if (layer_defs[layer_defs.length - 1].num_neurons !== this.num_actions) {
                    console.warn('TROUBLE! Number of regression neurons should be num_actions!');
                }
            }
            else {
                // create a very simple neural net by default
                layer_defs.push({ type: 'input', out_sx: 1, out_sy: 1, out_depth: this.net_inputs });
                if (typeof options.hidden_layer_sizes !== 'undefined') {
                    // allow user to specify this via the option, for convenience
                    var hl = options.hidden_layer_sizes;
                    for (var k = 0; k < hl.length; k++) {
                        layer_defs.push({ type: 'fc', num_neurons: hl[k], activation: 'relu' }); // relu by default
                    }
                }
                layer_defs.push({ type: 'regression', num_neurons: num_actions }); // value function output
            }
            this.value_net = new Net_1.Net();
            this.value_net.makeLayers(layer_defs);
            // and finally we need a Temporal Difference Learning trainer!
            var tdtrainer_options = {
                learning_rate: 0.01,
                momentum: 0.0,
                batch_size: 64,
                l2_decay: 0.01
            };
            if (typeof options.tdtrainer_options !== 'undefined') {
                tdtrainer_options = options.tdtrainer_options; // allow user to overwrite this
            }
            this.tdtrainer = new Trainer_1.Trainer(this.value_net, tdtrainer_options);
            // experience replay
            this.experience = [];
            // various housekeeping variables
            this.age = 0; // incremented every backward()
            this.forward_passes = 0; // incremented every forward()
            this.epsilon = 1.0; // controls exploration exploitation trade-off. Should be annealed over time
            this.latest_reward = 0;
            this.last_input_array = [];
            this.average_reward_window = new ConvNet.Window(1000, 10);
            this.average_loss_window = new ConvNet.Window(1000, 10);
            this.learning = true;
        }
        Brain.prototype.random_action = function () {
            // a bit of a helper function. It returns a random action
            // we are abstracting this away because in future we may want to
            // do more sophisticated things. For example some actions could be more
            // or less likely at "rest"/default state.
            if (this.random_action_distribution.length === 0) {
                return Random_1.Random.integer(0, this.num_actions);
            }
            else {
                // okay, lets do some fancier sampling:
                var p = Random_1.Random.float(0, 1.0);
                var cumprob = 0.0;
                for (var k = 0; k < this.num_actions; k++) {
                    cumprob += this.random_action_distribution[k];
                    if (p < cumprob) {
                        return k;
                    }
                }
            }
            return NaN;
        };
        Brain.prototype.policy = function (s) {
            // compute the value of doing any action in this state
            // and return the argmax action and its value
            var svol = new Vol_1.Vol(1, 1, this.net_inputs);
            svol.w = s;
            var action_values = this.value_net.forward(svol);
            var maxk = 0;
            var maxval = action_values.w[0];
            for (var k = 1; k < this.num_actions; k++) {
                if (action_values.w[k] > maxval) {
                    maxk = k;
                    maxval = action_values.w[k];
                }
            }
            return { action: maxk, value: maxval };
        };
        Brain.prototype.getNetInput = function (xt) {
            // return s = (x,a,x,a,x,a,xt) state vector.
            // It's a concatenation of last window_size (x,a) pairs and current state x
            var w = xt.slice(); // start with current state
            // and now go backwards and append states and actions from history temporal_window times
            var n = this.window_size;
            for (var k = 0; k < this.temporal_window; k++) {
                // state
                w = w.concat(this.state_window[n - 1 - k]);
                // action, encoded as 1-of-k indicator vector. We scale it up a bit because
                // we don't want weight regularization to undervalue this information, as it only exists once
                var action1ofk = Utility_1.initialize(this.num_actions);
                for (var q = 0; q < this.num_actions; q++)
                    action1ofk[q] = 0.0;
                action1ofk[this.action_window[n - 1 - k]] = 1.0 * this.num_states;
                w = w.concat(action1ofk);
            }
            return w;
        };
        Brain.prototype.forward = function (input_array) {
            var net_input;
            // compute forward (behavior) pass given the input neuron signals from body
            this.forward_passes += 1;
            this.last_input_array = input_array; // back this up
            // create network input
            var action;
            if (this.forward_passes > this.temporal_window) {
                // we have enough to actually do something reasonable
                net_input = this.getNetInput(input_array);
                if (this.learning) {
                    // compute epsilon for the epsilon-greedy policy
                    this.epsilon
                        = Math.min(1.0, Math.max(this.epsilon_min, 1.0 - (this.age - this.learning_steps_burnin) / (this.learning_steps_total - this.learning_steps_burnin)));
                }
                else {
                    this.epsilon = this.epsilon_test_time; // use test-time value
                }
                var rf = Random_1.Random.float(0, 1);
                if (rf < this.epsilon) {
                    // choose a random action with epsilon probability
                    action = this.random_action();
                }
                else {
                    // otherwise use our policy to make decision
                    var maxact = this.policy(net_input);
                    action = maxact.action;
                }
            }
            else {
                // pathological case that happens first few iterations
                // before we accumulate window_size inputs
                net_input = [];
                action = this.random_action();
            }
            // remember the state and action we took for backward pass
            this.net_window.shift();
            this.net_window.push(net_input);
            this.state_window.shift();
            this.state_window.push(input_array);
            this.action_window.shift();
            this.action_window.push(action);
            return action;
        };
        Brain.prototype.backward = function (reward) {
            var e;
            this.latest_reward = reward;
            this.average_reward_window.add(reward);
            this.reward_window.shift();
            this.reward_window.push(reward);
            if (!this.learning) {
                return;
            }
            // various book-keeping
            this.age += 1;
            // it is time t+1 and we have to store (s_t, a_t, r_t, s_{t+1}) as new experience
            // (given that an appropriate number of state measurements already exist, of course)
            if (this.forward_passes > this.temporal_window + 1) {
                var n = this.window_size;
                e = new Experience(this.net_window[n - 2], this.action_window[n - 2], this.reward_window[n - 2], this.net_window[n - 1]);
                if (this.experience.length < this.experience_size) {
                    this.experience.push(e);
                }
                else {
                    // replace. finite memory!
                    var ri = Random_1.Random.integer(0, this.experience_size);
                    this.experience[ri] = e;
                }
            }
            // learn based on experience, once we have some samples to go on
            // this is where the magic happens...
            if (this.experience.length > this.start_learn_threshold) {
                var avcost = 0.0;
                for (var k = 0; k < this.tdtrainer.batch_size; k++) {
                    var re = Random_1.Random.integer(0, this.experience.length);
                    e = this.experience[re];
                    var x = new ConvNet.Vol(1, 1, this.net_inputs);
                    x.w = e.state0;
                    var maxact = this.policy(e.state1);
                    var r = e.reward0 + this.gamma * maxact.value;
                    var ystruct = { dim: e.action0, val: r };
                    var loss = this.tdtrainer.train(x, ystruct);
                    avcost += loss.loss;
                }
                avcost = avcost / this.tdtrainer.batch_size;
                this.average_loss_window.add(avcost);
            }
        };
        Brain.prototype.visSelf = function (elt) {
            elt.innerHTML = ''; // erase elt first
            // elt is a DOM element that this function fills with brain-related information
            var brainvis = document.createElement('div');
            // basic information
            var desc = document.createElement('div');
            var t = '';
            t += 'experience replay size: ' + this.experience.length + '<br>';
            t += 'exploration epsilon: ' + this.epsilon + '<br>';
            t += 'age: ' + this.age + '<br>';
            t += 'average Q-learning loss: ' + this.average_loss_window.get_average() + '<br />';
            t += 'smooth-ish reward: ' + this.average_reward_window.get_average() + '<br />';
            desc.innerHTML = t;
            brainvis.appendChild(desc);
            elt.appendChild(brainvis);
        };
        return Brain;
    }());
    exports.Brain = Brain;
});
//# sourceMappingURL=Brain.js.map