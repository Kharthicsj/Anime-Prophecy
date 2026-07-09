export const toTitleCase = (str) => {
	return str.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
};

export const mergeUnique = (staticArr, dynamicArr) => {
	const set = new Set([...staticArr, ...dynamicArr]);
	return [...set];
};