export function safeGet(p, o) {
    return p.reduce((xs, x) =>
        (xs && xs[x]) ? xs[x] : null, o)
}

export function isValue(obj) {
    return obj !== null && obj !== undefined && obj !== '';
}

export function round(n, digits) {
    const delim = Math.pow(10, digits);
    return Math.round(n * delim) / delim;
}
