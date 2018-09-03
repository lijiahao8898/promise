function Promise (executor) {
    var that = this;
    this.state = 'pending';     // 状态
    this.value = null;          // 成功的值
    this.reason = null;         // 失败的值
    this.onFulfilledFun = [];
    this.onRejectedFunc = [];

    executor(resolve, reject);  // 马上执行

    function resolve (value) {
        // 当状态为pending时再做更新
        if (that.state === 'pending') {
            that.value = value;
            that.state = 'resolve';
            that.onFulfilledFun.forEach(function (item) {
                item(value);
            });
        }
    }

    function reject (reason) {
        // 当状态为pending时再做更新
        if (that.state === 'pending') {
            that.reason = reason;
            that.state = 'reject';
            that.onRejectedFunc.forEach(function (item) {
                item(reason);
            });
        }
    }
}

Promise.prototype = {
    then: function (onFulfilled, onRejected) {
        var that = this;
        var promise2 = new Promise(function (resolve, reject) {
            var x;
            // 等待态，此时异步代码还没有走完
            if (that.state === 'pending') {
                if (typeof onFulfilled === 'function') {
                    that.onFulfilledFun.push(onFulfilled);
                }
                if (typeof onRejected === 'function') {
                    that.onRejectedFunc.push(onRejected);
                }
            }
            if (that.state === 'resolve') {
                if (typeof onFulfilled === 'function') {
                    x = onFulfilled(that.value)
                }
            }
            if (that.state === 'reject') {
                if (typeof onRejected === 'function') {
                    x = onRejected(that.reason);
                }
            }
            return resolvePromise(promise2, x, resolve, reject)
        });
        return promise2
    }
};

/**
 * 解析then返回值与新Promise对象
 * @param {Object} promise2 新的Promise对象
 * @param {*} x 上一个then的返回值
 * @param {Function} resolve promise2的resolve
 * @param {Function} reject promise2的reject
 */

function resolvePromise (promise2, x, resolve, reject) {
    if (promise2 === x) {
        reject(new TypeError('Promise发生了循环引用'));
    }

    if (x !== 'null' && (typeof x === 'object' || typeof x === 'function')) {
        setTimeout(function () {
            try {
                let then = x.then;
                if (typeof then === 'function') {
                    //then是function，那么执行Promise
                    let y = then.call(x, function (y) {
                        // 递归调用，传入y若是Promise对象，继续循环
                        resolvePromise(promise2, y, resolve, reject);
                    }, function (r) {
                        reject(r);
                    });
                }
            } catch (e) {
                reject(e);
            }
        }, 0)
    } else {
        resolve(x);
    }
}