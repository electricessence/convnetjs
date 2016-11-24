
import {repeat} from "typescript-dotnet-umd/System/Collections/Array/Utility";

export type Float64ArrayLike = number[] | Float64Array;

export function zeros(count:number):Float64ArrayLike {

	if(!count || isNaN(count))
	{ return []; }

	if(typeof ArrayBuffer==='undefined')
	{
		// lacking browser support
		return repeat(0,count);
	}
	else
	{
		return new Float64Array(count);
	}

}