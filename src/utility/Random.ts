export module Random
{

// Random number utilities
	let return_v = false;
	let v_val = 0.0;

	export function gaussRandom():number
	{
		if(return_v)
		{
			//noinspection JSUnusedAssignment
			return_v = false;
			return v_val;
		}
		const u = 2*Math.random() - 1;
		const v = 2*Math.random() - 1;
		const r = u*u + v*v;
		if(r==0 || r>1) return gaussRandom();
		const c = Math.sqrt(-2*Math.log(r)/r);
		v_val = v*c; // cache this
		return_v = true;
		return u*c;
	}

	export function float(
		min:number,
		boundary:number):number
	{
		return Math.random()*(boundary - min) + min;
	}

	export function integer(
		min:number,
		boundary:number):number
	{
		return Math.floor(Math.random()*(boundary - min) + min);
	}

	export function n(mu:number, std:number):number
	{
		return mu + gaussRandom()*std;
	}

	/**
	 * create random permutation of numbers, in range [0...n-1]
	 * @param n
	 * @returns {number[]}
	 */
	export function set(n:number):number[]
	{
		let i:number = n,
		    j:number = 0,
		    temp:number;
		const array:number[] = [];
		for(let q = 0; q<n; q++) array[q] = q;
		while(i--)
		{
			j = Math.floor(Math.random()*(i + 1));
			temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		return array;
	}

	/**
	 * sample from list lst according to probabilities in list probs
	 * the two lists are of same size, and probs adds up to 1
	 * @param list
	 * @param probs
	 * @returns {number}
	 */
	export function weightedSample(list:number[], probs:number[]):number
	{
		const p = float(0, 1.0);
		let cumprob = 0.0;
		let k = 0;
		const n = list.length;
		for(; k<n; k++)
		{
			cumprob += probs[k];
			if(p<cumprob)
			{ return list[k]; }
		}

		// Shouldn't happen?
		return NaN;
	}
}

export default Random;