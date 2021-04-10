function throttle(fn, timeout) {
    const _context = this;
    let _timer, lastInvoke = 0;
    const _timeout = timeout || 100;
    function invoke() {
        fn.apply(_context, ...args)
        clearTimeout(_timer);
        _timer = null;
    }
    function throttled(...args) {
        const remaining = lastInvoke + _timeout - Date.now();
        if (remaining <= 0) {
            invoke()
        } else if (!_timer) {
            _timer = setTimeout(() => {
                invoke()
            }, _timeout);
        }
    }
    return throttled;
}

module.exports = {
    throttle
}