const hostLocation = location.hostname;
const _isDev = /(localhost)|(127\.0\.0\.1)/.test(hostLocation);

export function isDev(){
    return _isDev;
}