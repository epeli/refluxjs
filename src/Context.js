
var _ = require('./utils');


exports._key = "browser";

exports.assertContext = function assertContext() {
    if (_.isServer && exports._key === "browser") {
        throw new Error("Use Reflux.withContext(...) on the server");
    }
};

exports._knownContexts = {};

exports.bindContext = function bindContext(fn) {
    exports.assertContext();
    var contextKey = exports._key;
    return function() {
        var args = arguments;
        var ret;
        console.log("jea", contextKey);
        exports.withContext(contextKey, function() {
            ret = fn.apply(this, args);
        });
        return ret;
    };
};

exports.getCurrentContext = function getCurrentContext() {
    exports.assertContext();
    if (!exports._knownContexts[exports._key]) {
        exports._knownContexts[exports._key] = {};
    }

    return exports._knownContexts[exports._key];

};

exports.destroyContext = function destroyContext(contextKey) {
    delete exports._knownContexts[contextKey];
};

exports.withContext = function withContext(contextKey, cb) {

    if (typeof contextKey !== "string") {
        throw new TypeError("Context must be a string");
    }

    var ret;

    exports._key = contextKey;
    try {
        ret = cb();
    } catch (err) {
        exports._key = "browser";
        throw err;
    }

    exports._key = "browser";

    return ret;

};


