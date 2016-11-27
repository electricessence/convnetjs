/**
 * returns min, max and indices of an array
 * @param w
 * @returns {{}}
 */
export function maxmin(w:number[]|Float64Array):{maxi?: number, maxv?: number, mini?: number, minv?: number, dv?: number}
{
	if(w.length===0)
	{ return {}; } // ... ;s

	let maxv = w[0];
	let minv = w[0];
	let maxi = 0;
	let mini = 0;
	for(let i = 1; i<w.length; i++)
	{
		if(w[i]>maxv)
		{
			maxv = w[i];
			maxi = i;
		}
		if(w[i]<minv)
		{
			minv = w[i];
			mini = i;
		}
	}
	return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv: maxv - minv};
}

export default maxmin;