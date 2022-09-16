const hostLocation = location.hostname;
const _isDev = /(localhost)|(127\.0\.0\.1)|/.test(hostLocation);
const _isProd = !_isDev && !(/staging/.test(hostLocation));

export function isDev(){
    return _isDev;
}

export function isProd(){
    return _isProd;
}