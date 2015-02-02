var _ = require('./utils'),
    Reflux = require('./index'),
    Keep = require('./Keep'),
    mixer = require('./mixer'),
    allowed = {preEmit:1,shouldEmit:1},
    bindMethods = require('./bindMethods');


var StoreStateMethods = {

    createInitialState: function() {
        return {};
    },

    _ensureState: function() {
        var context = Context.getCurrentContext();

        if (context[this.name]) return;

        if (!_.isServer && window.REFLUX_INITIAL_STORE_STATES) {
            context[this.name] = window.REFLUX_INITIAL_STORE_STATES[this.name];
        } else {
            context[this.name] = this.createInitialState();
        }
    },

    getInitialState: function() {
        return this.getState();
    },

    getState: function() {
        Context.assertContext();
        var context = Context.getCurrentContext();

        this._ensureState();

        return context[this.name];
    },

    setState: function(newState) {
        _.extend(this.getState(), newState);
    },

};


/**
 * Creates an event emitting Data Store. It is mixed in with functions
 * from the `ListenerMethods` and `PublisherMethods` mixins. `preEmit`
 * and `shouldEmit` may be overridden in the definition object.
 *
 * @param {Object} definition The data store object definition
 * @returns {Store} A data store instance
 */
module.exports = function(definition) {

    definition = definition || {};
    var name = definition.name;

    if (typeof name !== "string") {
        throw new TypeError("Store must be created with a unique 'name' property");
    }

    var isDuplicate = Keep.createdStores.some(function(s) {
        return name === s.name;
    });

    if (isDuplicate) {
        throw new Error("Store '" + name + "' already exists");
    }


    for(var a in Reflux.StoreMethods){
        if (!allowed[a] && (Reflux.PublisherMethods[a] || Reflux.ListenerMethods[a])){
            throw new Error("Cannot override API method " + a +
                " in Reflux.StoreMethods. Use another method name or override it on Reflux.PublisherMethods / Reflux.ListenerMethods instead."
            );
        }
    }

    for(var d in definition){
        if (!allowed[d] && (Reflux.PublisherMethods[d] || Reflux.ListenerMethods[d])){
            throw new Error("Cannot override API method " + d +
                " in store creation. Use another method name or override it on Reflux.PublisherMethods / Reflux.ListenerMethods instead."
            );
        }
    }

    definition = mixer(definition);

    function Store() {
        var i=0, arr;
        this.subscriptions = [];
        this.emitter = new _.EventEmitter();
        this.eventLabel = "change";
        bindMethods(this, definition);
        if (this.init && _.isFunction(this.init)) {
            this.init();
        }
        if (this.listenables){
            arr = [].concat(this.listenables);
            for(;i < arr.length;i++){
                this.listenToMany(arr[i]);
            }
        }
    }

    _.extend(Store.prototype, Reflux.ListenerMethods, Reflux.PublisherMethods, Reflux.StoreMethods, definition);

    var store = new Store();
    Keep.createdStores.push(store);

    return store;
};
