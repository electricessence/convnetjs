/* contains various utility functions */
import maxmin from "./utility/maxmin";
import f2t from "./utility/f2t";


/**
 * a window stores _size_ number of values
 * and returns averages. Useful for keeping running
 * track of validation or training accuracy during SGD
 */
export class Window
{
	values:number[];
	sum:number;

	constructor(
		public readonly size:number = 100,
		public readonly minsize:number = 20)
	{
		this.reset();
	}

	add(x:number):void
	{
		const v = this.values;
		v.push(x);
		this.sum += x;
		if(v.length>this.size)
		{
			this.sum -= v.shift();
		}
	}

	get_average():number
	{
		const v = this.values;
		if(v.length<this.minsize) return -1;
		else return this.sum/v.length;
	}

	reset():void
	{
		this.values = [];
		this.sum = 0;
	}
}


export {maxmin};
export {f2t};
