// Resource manager
// -----------------------------------------------------------------------------

// .subscribe() allows to subscribe to any number of urls and to execute a callback (or few) when
//              there is a known status for each one of them (received or failed);
//              callback receives an array of results of length equal to the given urls array
//              and with null in place of urls which were failed to receive, and it receives total
//              failure count;
//
// .loadOrGet() should be called for every remote resource Resource Manager should be aware of;
//              it receives a loader function that actually should request for that resource in any way
//              it wants to (async or not), but should call provided success handler in case of success
//              or error handler in case of failure; `subject_id` should be the same as for corresponding
//              subscribe group (it's the only way we currently found to ensure to unsubscribe loaders
//              from single subject, instead of all, in case of cancel);
//
// .check() is the internal function that iterates through all subscriptions, checks the status
//          of the urls and calls the subscribed callbacks in case if their resources are ready;
//          it is called by Resource Manager itself in cases when there was a chance that some resource
//          changed status;
//
// .trigger() notifies Resource Manager about the fact that resource located at given URL was successfully
//            received and provides it the received value; may be called from outside; forces .check() call;
//
// .error() notifies Resource Manager about the fact that resource expected to be located at some URL
//          was failed to be received and provides it the error object as a cause of the failure;
//          may be called from outside; forces .check() call;
//
// .has() checks if the resource with given URL is stored in Resource Manager's cache (was received before);
//
// .clear() clears all the subscriptions from this subject;

// The system designed with intention (but not restricted to it) that any player will first subscribe (using its ID)
// to all remote resources from current animation, then trigger them to load with multiple .loadOrGet() calls (with passing
// the same ID). In .loadOrGet() it should call .trigger() or .error() for a resource in appropriate case.
// If player needs to stop loading remote resources (i.e. if animation was accidentally changed when it
// already started but nor finished loading them, or if it was required to be detached at some point in-between),
// it should call .cancel() with its ID.
// NB: Notice, that no check is performed just after subscription! Because if new player instance will request resource
//     which is in cache thanks to previous instance, its own loader (.loadOrGet()) will not be called!

// FIXME: loader in .loadOrGet() should call trigger() and error() instead of notifiers
// FIXME: get rid of subject_id in .loadOrGet(), it requires to pass player or animation everywhere inside
//        (may be in favor of subscriptions groups and generating ID automatically inside)
//        the main pitfall here is that sheet.load or audio.load requires player as an argument

var conf = require('./conf.js'),
    log = require('./log.js'),
    is = require('./utils.js').is;

function rmLog(str) {
  if (conf.logResMan) {
    log.debug(str);
  }
}

/**
 * @singleton @class anm.ResourceManager
 */
function ResourceManager() {
    this._cache = {};
    this._errors = {};
    this._waiting = {};
    this._subscriptions = {};
    this._url_to_subjects = {};
}

ResourceManager.prototype.subscribe = function(subject_id, urls, callbacks) {
    if (!subject_id) throw new Error('Subject ID is empty');
    if (this._subscriptions[subject_id]) throw new Error('This subject (\'' + subject_id + '\') is already subscribed to ' +
                                                         'a bunch of resources, please group them in one.');
    var filteredUrls = [];
    rmLog('subscribing ' + callbacks.length + ' to ' + urls.length + ' urls: ' + urls);
    for (var i = 0; i < urls.length; i++){
        // there should be no empty urls
        if (urls[i]) {
            filteredUrls.push(urls[i]);
            if (!this._url_to_subjects[urls[i]]) {
                this._url_to_subjects[urls[i]] = [];
            }
            this._url_to_subjects[urls[i]].push(subject_id);
        }
    }
    this._subscriptions[subject_id] = [ filteredUrls,
                                        is.arr(callbacks) ? callbacks : [ callbacks ] ];
};

ResourceManager.prototype.loadOrGet = function(subject_id, url, loader, onComplete, onError) {
    var me = this;
    if (!subject_id) throw new Error('Subject ID is empty');
    if (!url) throw new Error('Given URL is empty');
    rmLog('request to load ' + url);
    if (me._cache[url]) {
        rmLog('> already received, trigerring success');
        var result = me._cache[url];
        if (onComplete) onComplete(result);
        me.trigger(url, result); // TODO: is it needed?
    } else if (me._errors[url]) {
        rmLog('> failed to load before, notifying with error');
        if (onError) onError(me._errors[url]);
    } else if (!me._waiting[subject_id] ||
               !(me._waiting[subject_id] && me._waiting[subject_id][url])) {
        rmLog('> not cached, requesting');
        if (!me._waiting[subject_id]) me._waiting[subject_id] = {};
        me._waiting[subject_id][url] = loader;
        loader(function(result) {
            result = result || true; //so that the loader isn't obliged to return something
            rmLog('file at ' + url + ' succeeded to load, triggering success');
            me.trigger(url, result);
            if (onComplete) onComplete(result);
            me.check();
        }, function(err) {
            rmLog('file at ' + url + ' failed to load, triggering error');
            me.error(url, err);
            if (onError) onError(err);
            me.check();
        });
    } else /*if (me._waiting[subject_id] && me._waiting[subject_id][url])*/ { // already waiting
        rmLog('> someone is already waiting for it, subscribing');
        me.subscribe(subject_id + (new Date()).getTime() + Math.random(), [ url ], function(res) {
            if (res[0]) { onComplete(res[0]); }
            else { onError(res[0]); }
        });

    }
};

ResourceManager.prototype.trigger = function(url, value) {
    if (this._cache[url] || this._errors[url]) { this.check(); return; }
    rmLog('triggering success for url ' + url);
    var subjects = this._url_to_subjects[url];
    if (subjects) { for (var i = 0, il = subjects.length; i < il; i++) {
        if (this._waiting[subjects[i]]) {
            delete this._waiting[subjects[i]][url];
        }
    } }
    this._cache[url] = value;
    //this.check(); FIXME: .loadOrGet() calls .check() itself in this case, after the onError
};

ResourceManager.prototype.error = function(url, err) {
    if (this._cache[url] || this._errors[url]) { this.check(); return; }
    rmLog('triggering error for url ' + url);
    var subjects = this._url_to_subjects[url];
    if (subjects) { for (var i = 0, il = subjects.length; i < il; i++) {
        if (this._waiting[subjects[i]]) {
            delete this._waiting[subjects[i]][url];
        }
    } }
    this._errors[url] = err;
    //this.check(); FIXME: .loadOrGet() calls .check() itself in this case, after the onError
};

ResourceManager.prototype.has = function(url) {
    return (typeof this._cache[url] !== 'undefined');
};

// call this only if you are sure you want to force this check —
// this method is called automatically when every new incoming url is triggered
// as complete or failed
ResourceManager.prototype.check = function() {
    rmLog('checking subscriptions');
    var subscriptions = this._subscriptions,
        cache = this._cache,
        errors = this._errors,
        to_remove = null;
    for (var subject_id in subscriptions) {
        rmLog('subscription group \'' + subject_id + '\'');
        var urls = subscriptions[subject_id][0],
            callbacks = subscriptions[subject_id][1],
            error_count = 0,
            success_count = 0, u;
        for (u = 0, ul = urls.length; u < ul; u++) {
            if (errors[urls[u]]) error_count++;
            if (cache[urls[u]]) success_count++;
        }
        rmLog('success: ' + success_count + ', errors: ' + error_count +
            ', ready: ' + ((success_count + error_count) === urls.length));
        if ((success_count + error_count) === urls.length) {
            var ready = [];
            for (u = 0, ul = urls.length; u < ul; u++) {
                ready.push(cache[urls[u]] || errors[urls[u]]);
            }
            rmLog('notifying subscribers that ' + urls + ' are all ready');
            for (var k = 0, kl = callbacks.length; k < kl; k++) {
                //callbacks[k].call(subscriber, ready, error_count);
                callbacks[k](ready, error_count);
            }
            if (!to_remove) to_remove = [];
            to_remove.push(subject_id);
        }
    }
    if (to_remove) { for (var i = 0, il = to_remove.length; i < il; i++) {
        rmLog('removing notified subscribers for subject \'' +
            to_remove[i] + '\' from queue');
        delete subscriptions[to_remove[i]];
    } }
};

ResourceManager.prototype.cancel = function(subject_id) {
    if (!subject_id) throw new Error('Subject ID is empty');
    if (this._waiting[subject_id]) {
        var urls = this._subscriptions[subject_id][0];
        if (urls) { for (var u = 0, ul = urls.length; u < ul; u++) {
            delete this._waiting[subject_id][urls[u]];
        } }
    }
    // clear _url_to_subjects ?
    delete this._subscriptions[subject_id];
};

ResourceManager.prototype.clear = function() {
    this._cache = {};
    this._errors = {};
    this._waiting = {};
    this._loaders = {};
    this._subscriptions = {};
};

module.exports = new ResourceManager();
