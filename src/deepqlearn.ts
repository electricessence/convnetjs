import {TrainerOptions} from "./convnet_trainers";
export const REVISION = 'ALPHA';
import * as ConvNet from './ConvNet/index';
import {Random} from "./utility/Random";


/**
 * An agent is in state0 and does action0
 * environment then assigns reward0 and provides new state, state1
 * Experience nodes store all this information, which is used in the
 * Q-learning update step
 */
export class Experience
{
	constructor(
		public state0,
		public action0,
		public reward0,
		public state1)
	{

	}
}



/**
 * A Brain object does all the magic.
 * over time it receives some inputs and some rewards
 * and its job is to set the outputs to maximize the expected reward
 */
export class Brain implements Brain.Options
{
	/* Options */
	temporal_window:number;
	experience_size:number;
	start_learn_threshold:number;
	gamma:number;
	learning_steps_total:number;
	learning_steps_burnin:number;
	epsilon_min:number;
	epsilon_test_time:number;
	random_action_distribution:number[];


	net_inputs:number;

	window_size:number;
	state_window:any[];
	action_window:any[];
	reward_window:any[];
	net_window:any[];


	learning:boolean;

	experience:Experience[];

	// various housekeeping variables
	age:number;
	forward_passes:number; // incremented every forward()
	epsilon:number; // controls exploration exploitation tradeoff. Should be annealed over time
	latest_reward:number;
	last_input_array = [];
	average_reward_window:ConvNet.Window;
	average_loss_window:ConvNet.Window;

	constructor(public num_states, public num_actions, options:Brain.Options = {})
	{
		// in number of time steps, of temporal memory
		// the ACTUAL input to the net will be (x,a) temporal_window times, and followed by current x
		// so to have no information from previous time step going into value function, set to 0.
		this.temporal_window = typeof options.temporal_window!=='undefined'
			? options.temporal_window
			: 1;
		// size of experience replay memory
		this.experience_size = typeof options.experience_size!=='undefined'
			? options.experience_size
			: 30000;
		// number of examples in experience replay memory before we begin learning
		this.start_learn_threshold = typeof options.start_learn_threshold!=='undefined'
			? options.start_learn_threshold
			: Math.floor(Math.min(this.experience_size*0.1, 1000));
		// gamma is a crucial parameter that controls how much plan-ahead the agent does. In [0,1]
		this.gamma = typeof options.gamma!=='undefined' ? options.gamma : 0.8;

		// number of steps we will learn for
		this.learning_steps_total = typeof options.learning_steps_total!=='undefined'
			? options.learning_steps_total
			: 100000;
		// how many steps of the above to perform only random actions (in the beginning)?
		this.learning_steps_burnin = typeof options.learning_steps_burnin!=='undefined'
			? options.learning_steps_burnin
			: 3000;
		// what epsilon value do we bottom out on? 0.0 => purely deterministic policy at end
		this.epsilon_min = typeof options.epsilon_min!=='undefined' ? options.epsilon_min : 0.05;
		// what epsilon to use at test time? (i.e. when learning is disabled)
		this.epsilon_test_time = typeof options.epsilon_test_time!=='undefined'
			? options.epsilon_test_time
			: 0.01;

		// advanced feature. Sometimes a random action should be biased towards some values
		// for example in flappy bird, we may want to choose to not flap more often
		if(typeof options.random_action_distribution!=='undefined')
		{
			// this better sum to 1 by the way, and be of length this.num_actions
			this.random_action_distribution = options.random_action_distribution;
			if(this.random_action_distribution.length!==num_actions)
			{
				console.warn('TROUBLE. random_action_distribution should be same length as num_actions.');
			}
			const a = this.random_action_distribution;
			let s = 0.0;
			for(let k = 0; k<a.length; k++)
			{ s += a[k]; }
			if(Math.abs(s - 1.0)>0.0001)
			{ console.warn('TROUBLE. random_action_distribution should sum to 1!'); }
		}
		else
		{
			this.random_action_distribution = [];
		}

		// states that go into neural net to predict optimal action look as
		// x0,a0,x1,a1,x2,a2,...xt
		// this variable controls the size of that temporal window. Actions are
		// encoded as 1-of-k hot vectors
		this.net_inputs
			= num_states*this.temporal_window + num_actions*this.temporal_window + num_states;
		this.window_size = Math.max(this.temporal_window, 2); // must be at least 2, but if we want more context even more
		this.state_window = new Array(this.window_size);
		this.action_window = new Array(this.window_size);
		this.reward_window = new Array(this.window_size);
		this.net_window = new Array(this.window_size);

		// create [state -> value of all possible actions] modeling net for the value function
		let layer_defs:any[] = [];
		if(typeof options.layer_defs!=='undefined')
		{
			// this is an advanced usage feature, because size of the input to the network, and number of
			// actions must check out. This is not very pretty Object Oriented programming but I can't see
			// a way out of it :(
			layer_defs = options.layer_defs;
			if(layer_defs.length<2)
			{ console.warn('TROUBLE! must have at least 2 layers'); }
			if(layer_defs[0].type!=='input')
			{ console.warn('TROUBLE! first layer must be input layer!'); }
			if(layer_defs[layer_defs.length - 1].type!=='regression')
			{ console.warn('TROUBLE! last layer must be input regression!'); }
			if(layer_defs[0].out_depth*layer_defs[0].out_sx*layer_defs[0].out_sy!==this.net_inputs)
			{
				console.warn('TROUBLE! Number of inputs must be num_states * temporal_window + num_actions * temporal_window + num_states!');
			}
			if(layer_defs[layer_defs.length - 1].num_neurons!==this.num_actions)
			{
				console.warn('TROUBLE! Number of regression neurons should be num_actions!');
			}
		}
		else
		{
			// create a very simple neural net by default
			layer_defs.push({type: 'input', out_sx: 1, out_sy: 1, out_depth: this.net_inputs});
			if(typeof options.hidden_layer_sizes!=='undefined')
			{
				// allow user to specify this via the option, for convenience
				const hl = options.hidden_layer_sizes;
				for(var k = 0; k<hl.length; k++)
				{
					layer_defs.push({type: 'fc', num_neurons: hl[k], activation: 'relu'}); // relu by default
				}
			}
			layer_defs.push({type: 'regression', num_neurons: num_actions}); // value function output
		}
		this.value_net = new convnetjs.Net();
		this.value_net.makeLayers(layer_defs);

		// and finally we need a Temporal Difference Learning trainer!
		let tdtrainer_options:TrainerOptions = {
			learning_rate: 0.01,
			momentum: 0.0,
			batch_size: 64,
			l2_decay: 0.01
		};
		if(typeof options.tdtrainer_options!=='undefined')
		{
			tdtrainer_options = options.tdtrainer_options; // allow user to overwrite this
		}
		this.tdtrainer = new convnetjs.SGDTrainer(this.value_net, tdtrainer_options);

		// experience replay
		this.experience = [];

		// various housekeeping variables
		this.age = 0; // incremented every backward()
		this.forward_passes = 0; // incremented every forward()
		this.epsilon = 1.0; // controls exploration exploitation tradeoff. Should be annealed over time
		this.latest_reward = 0;
		this.last_input_array = [];
		this.average_reward_window = new cnnutil.Window(1000, 10);
		this.average_loss_window = new cnnutil.Window(1000, 10);
		this.learning = true;
	}

	random_action()
	{
		// a bit of a helper function. It returns a random action
		// we are abstracting this away because in future we may want to
		// do more sophisticated things. For example some actions could be more
		// or less likely at "rest"/default state.
		if(this.random_action_distribution.length===0)
		{
			return convnetjs.randi(0, this.num_actions);
		}
		else
		{
			// okay, lets do some fancier sampling:
			const p = convnetjs.randf(0, 1.0);
			let cumprob = 0.0;
			for(let k = 0; k<this.num_actions; k++)
			{
				cumprob += this.random_action_distribution[k];
				if(p<cumprob)
				{ return k; }
			}
		}
	}

	policy(s)
	{
		// compute the value of doing any action in this state
		// and return the argmax action and its value
		const svol = new convnetjs.Vol(1, 1, this.net_inputs);
		svol.w = s;
		const action_values = this.value_net.forward(svol);
		let maxk = 0;
		let maxval = action_values.w[0];
		for(let k = 1; k<this.num_actions; k++)
		{
			if(action_values.w[k]>maxval)
			{
				maxk = k;
				maxval = action_values.w[k];
			}
		}
		return {action: maxk, value: maxval};
	}

	getNetInput(xt)
	{
		// return s = (x,a,x,a,x,a,xt) state vector.
		// It's a concatenation of last window_size (x,a) pairs and current state x
		let w = [];
		w = w.concat(xt); // start with current state
		// and now go backwards and append states and actions from history temporal_window times
		const n = this.window_size;
		for(let k = 0; k<this.temporal_window; k++)
		{
			// state
			w = w.concat(this.state_window[n - 1 - k]);
			// action, encoded as 1-of-k indicator vector. We scale it up a bit because
			// we dont want weight regularization to undervalue this information, as it only exists once
			const action1ofk = new Array(this.num_actions);
			for(let q = 0; q<this.num_actions; q++) action1ofk[q] = 0.0;
			action1ofk[this.action_window[n - 1 - k]] = 1.0*this.num_states;
			w = w.concat(action1ofk);
		}
		return w;
	}

	forward(input_array)
	{
		// compute forward (behavior) pass given the input neuron signals from body
		this.forward_passes += 1;
		this.last_input_array = input_array; // back this up

		// create network input
		let action;
		if(this.forward_passes>this.temporal_window)
		{
			// we have enough to actually do something reasonable
			var net_input = this.getNetInput(input_array);
			if(this.learning)
			{
				// compute epsilon for the epsilon-greedy policy
				this.epsilon
					= Math.min(1.0, Math.max(this.epsilon_min, 1.0 - (this.age - this.learning_steps_burnin)/(this.learning_steps_total - this.learning_steps_burnin)));
			}
			else
			{
				this.epsilon = this.epsilon_test_time; // use test-time value
			}
			const rf = convnetjs.randf(0, 1);
			if(rf<this.epsilon)
			{
				// choose a random action with epsilon probability
				action = this.random_action();
			}
			else
			{
				// otherwise use our policy to make decision
				const maxact = this.policy(net_input);
				action = maxact.action;
			}
		}
		else
		{
			// pathological case that happens first few iterations
			// before we accumulate window_size inputs
			var net_input = [];
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
	}

	backward(reward:number)
	{
		this.latest_reward = reward;
		this.average_reward_window.add(reward);
		this.reward_window.shift();
		this.reward_window.push(reward);

		if(!this.learning)
		{ return; }

		// various book-keeping
		this.age += 1;

		// it is time t+1 and we have to store (s_t, a_t, r_t, s_{t+1}) as new experience
		// (given that an appropriate number of state measurements already exist, of course)
		if(this.forward_passes>this.temporal_window + 1)
		{
			var e = new Experience();
			const n = this.window_size;
			e.state0 = this.net_window[n - 2];
			e.action0 = this.action_window[n - 2];
			e.reward0 = this.reward_window[n - 2];
			e.state1 = this.net_window[n - 1];
			if(this.experience.length<this.experience_size)
			{
				this.experience.push(e);
			}
			else
			{
				// replace. finite memory!
				const ri = convnetjs.randi(0, this.experience_size);
				this.experience[ri] = e;
			}
		}

		// learn based on experience, once we have some samples to go on
		// this is where the magic happens...
		if(this.experience.length>this.start_learn_threshold)
		{
			let avcost = 0.0;
			for(let k = 0; k<this.tdtrainer.batch_size; k++)
			{
				const re = Random.integer(0, this.experience.length);
				var e = this.experience[re];
				const x = new ConvNet.Vol(1, 1, this.net_inputs);
				x.w = e.state0;
				const maxact = this.policy(e.state1);
				const r = e.reward0 + this.gamma*maxact.value;
				const ystruct = {dim: e.action0, val: r};
				const loss = this.tdtrainer.train(x, ystruct);
				avcost += loss.loss;
			}
			avcost = avcost/this.tdtrainer.batch_size;
			this.average_loss_window.add(avcost);
		}
	}

	visSelf(elt)
	{
		elt.innerHTML = ''; // erase elt first

		// elt is a DOM element that this function fills with brain-related information
		const brainvis = document.createElement('div');

		// basic information
		const desc = document.createElement('div');
		let t = '';
		t += 'experience replay size: ' + this.experience.length + '<br>';
		t += 'exploration epsilon: ' + this.epsilon + '<br>';
		t += 'age: ' + this.age + '<br>';
		t += 'average Q-learning loss: ' + this.average_loss_window.get_average() + '<br />';
		t += 'smooth-ish reward: ' + this.average_reward_window.get_average() + '<br />';
		desc.innerHTML = t;
		brainvis.appendChild(desc);

		elt.appendChild(brainvis);
	}
}

export module Brain {
	export interface Options
	{
		temporal_window?:number;
		experience_size?:number;
		start_learn_threshold?:number;
		gamma?:number;
		learning_steps_total?:number;
		learning_steps_burnin?:number;
		epsilon_min?:number;
		epsilon_test_time?:number;
		random_action_distribution?:number[];
		hidden_layer_sizes?:number[];
		tdtrainer_options?:TrainerOptions;
		layer_defs?:any[]; // layers?
	}
}

