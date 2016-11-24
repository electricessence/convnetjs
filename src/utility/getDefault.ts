import {IMap} from "typescript-dotnet-umd/IMap";

/**
 * syntactic sugar function for getting default parameter values
 * @param source
 * @param key
 * @param default_value
 * @returns {any}
 */
export function getDefault<T,TSource extends IMap<any>>(
	source:TSource, key:string|string[],
	default_value:T):T
{
	if(typeof key==='string')
	{
		// case of single string
		return (typeof source[key]!=='undefined') ? source[key] : default_value;
	}
	else
	{
		// assume we are given a list of string instead
		let ret = default_value;
		for(let f of key)
		{
			if(typeof source[f]!=='undefined')
			{
				ret = source[f]; // overwrite return value
			}
		}
		return ret;
	}
}

export default getDefault;