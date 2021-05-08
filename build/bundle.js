
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Header.svelte generated by Svelte v3.37.0 */

    const file$e = "src/Header.svelte";

    function create_fragment$g(ctx) {
    	let header;

    	const block = {
    		c: function create() {
    			header = element("header");
    			attr_dev(header, "class", "header svelte-x0k61w");
    			add_location(header, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.37.0 */

    const file$d = "src/Footer.svelte";

    function create_fragment$f(ctx) {
    	let footer;
    	let t0;
    	let a;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			t0 = text("2021 ");
    			a = element("a");
    			a.textContent = "Paweł Paściak";
    			attr_dev(a, "href", "https://github.com/ppasciak");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$d, 1, 9, 18);
    			attr_dev(footer, "class", "svelte-13qh0a");
    			add_location(footer, file$d, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, t0);
    			append_dev(footer, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src/Layout.svelte generated by Svelte v3.37.0 */
    const file$c = "src/Layout.svelte";

    function create_fragment$e(ctx) {
    	let main;
    	let header;
    	let t0;
    	let div;
    	let t1;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div, "class", "container svelte-1y6sn49");
    			add_location(div, file$c, 7, 4, 142);
    			attr_dev(main, "class", "app svelte-1y6sn49");
    			add_location(main, file$c, 5, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t0);
    			append_dev(main, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(main, t1);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(default_slot, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(default_slot, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			if (default_slot) default_slot.d(detaching);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Header, Footer });
    	return [$$scope, slots];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap$1(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.37.0 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block$7(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$7, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap$1({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap$1,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componentes/basket/QuantitySelector.svelte generated by Svelte v3.37.0 */
    const file$b = "src/componentes/basket/QuantitySelector.svelte";

    function create_fragment$c(ctx) {
    	let button0;
    	let t1;
    	let span;
    	let t2;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "-";
    			t1 = space();
    			span = element("span");
    			t2 = text(/*quantity*/ ctx[0]);
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			attr_dev(button0, "class", "square svelte-1ytkkta");
    			add_location(button0, file$b, 22, 0, 444);
    			attr_dev(span, "class", "product-quanity__value svelte-1ytkkta");
    			add_location(span, file$b, 23, 0, 504);
    			attr_dev(button1, "class", "square svelte-1ytkkta");
    			add_location(button1, file$b, 24, 0, 559);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleDecrease*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*handleIncrease*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*quantity*/ 1) set_data_dev(t2, /*quantity*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("QuantitySelector", slots, []);
    	let { quantity = 0 } = $$props;
    	let { id } = $$props;
    	const dispatch = createEventDispatcher();

    	const handleDecrease = () => {
    		if (quantity > 0) {
    			$$invalidate(0, quantity -= 1);
    		}

    		
    		dispatch("quantityChange", { id, quantity });
    	};

    	const handleIncrease = () => {
    		$$invalidate(0, quantity += 1);
    		dispatch("quantityChange", { id, quantity });
    	};

    	const writable_props = ["quantity", "id"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QuantitySelector> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("quantity" in $$props) $$invalidate(0, quantity = $$props.quantity);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    	};

    	$$self.$capture_state = () => ({
    		quantity,
    		id,
    		createEventDispatcher,
    		dispatch,
    		handleDecrease,
    		handleIncrease
    	});

    	$$self.$inject_state = $$props => {
    		if ("quantity" in $$props) $$invalidate(0, quantity = $$props.quantity);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [quantity, handleDecrease, handleIncrease, id];
    }

    class QuantitySelector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { quantity: 0, id: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QuantitySelector",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[3] === undefined && !("id" in props)) {
    			console.warn("<QuantitySelector> was created without expected prop 'id'");
    		}
    	}

    	get quantity() {
    		throw new Error("<QuantitySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quantity(value) {
    		throw new Error("<QuantitySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<QuantitySelector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<QuantitySelector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const BasketStore = writable();

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/componentes/basket/ProductItem.svelte generated by Svelte v3.37.0 */
    const file$a = "src/componentes/basket/ProductItem.svelte";

    function create_fragment$b(ctx) {
    	let li;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let quantityselector;
    	let t3;
    	let div3;
    	let span1;
    	let t4;
    	let t5;
    	let span0;
    	let t7;
    	let span2;
    	let t8_value = (/*price*/ ctx[2] * (1 + /*taxRate*/ ctx[5])).toFixed(2) + "";
    	let t8;
    	let t9;
    	let t10;
    	let div4;
    	let button;
    	let li_outro;
    	let current;
    	let mounted;
    	let dispose;

    	quantityselector = new QuantitySelector({
    			props: {
    				quantity: /*quantity*/ ctx[1],
    				id: /*id*/ ctx[4]
    			},
    			$$inline: true
    		});

    	quantityselector.$on("quantityChange", /*handleQuantityChange*/ ctx[6]);

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			div2 = element("div");
    			create_component(quantityselector.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			span1 = element("span");
    			t4 = text(/*price*/ ctx[2]);
    			t5 = space();
    			span0 = element("span");
    			span0.textContent = "USD";
    			t7 = space();
    			span2 = element("span");
    			t8 = text(t8_value);
    			t9 = text(" tax inc.");
    			t10 = space();
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "X";
    			if (img.src !== (img_src_value = `../assets/products/${/*image*/ ctx[3]}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*name*/ ctx[0]);
    			attr_dev(img, "class", "svelte-191393z");
    			add_location(img, file$a, 38, 4, 1016);
    			attr_dev(div0, "class", "product__image svelte-191393z");
    			add_location(div0, file$a, 37, 2, 983);
    			attr_dev(div1, "class", "product__name svelte-191393z");
    			add_location(div1, file$a, 40, 2, 1082);
    			attr_dev(div2, "class", "product__qty svelte-191393z");
    			add_location(div2, file$a, 41, 2, 1124);
    			attr_dev(span0, "class", "prodcut__price__currency svelte-191393z");
    			add_location(span0, file$a, 49, 19, 1314);
    			attr_dev(span1, "class", "svelte-191393z");
    			add_location(span1, file$a, 49, 4, 1299);
    			attr_dev(span2, "class", "product__price--tax-inc svelte-191393z");
    			add_location(span2, file$a, 50, 4, 1375);
    			attr_dev(div3, "class", "product__price svelte-191393z");
    			add_location(div3, file$a, 48, 2, 1266);
    			attr_dev(button, "class", "square remove svelte-191393z");
    			add_location(button, file$a, 55, 4, 1523);
    			attr_dev(div4, "class", "product__action svelte-191393z");
    			add_location(div4, file$a, 54, 2, 1489);
    			attr_dev(li, "class", "product svelte-191393z");
    			add_location(li, file$a, 36, 0, 919);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, img);
    			append_dev(li, t0);
    			append_dev(li, div1);
    			append_dev(div1, t1);
    			append_dev(li, t2);
    			append_dev(li, div2);
    			mount_component(quantityselector, div2, null);
    			append_dev(li, t3);
    			append_dev(li, div3);
    			append_dev(div3, span1);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(span1, span0);
    			append_dev(div3, t7);
    			append_dev(div3, span2);
    			append_dev(span2, t8);
    			append_dev(span2, t9);
    			append_dev(li, t10);
    			append_dev(li, div4);
    			append_dev(div4, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleProductRemove*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*image*/ 8 && img.src !== (img_src_value = `../assets/products/${/*image*/ ctx[3]}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*name*/ 1) {
    				attr_dev(img, "alt", /*name*/ ctx[0]);
    			}

    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			const quantityselector_changes = {};
    			if (dirty & /*quantity*/ 2) quantityselector_changes.quantity = /*quantity*/ ctx[1];
    			if (dirty & /*id*/ 16) quantityselector_changes.id = /*id*/ ctx[4];
    			quantityselector.$set(quantityselector_changes);
    			if (!current || dirty & /*price*/ 4) set_data_dev(t4, /*price*/ ctx[2]);
    			if ((!current || dirty & /*price, taxRate*/ 36) && t8_value !== (t8_value = (/*price*/ ctx[2] * (1 + /*taxRate*/ ctx[5])).toFixed(2) + "")) set_data_dev(t8, t8_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quantityselector.$$.fragment, local);
    			if (li_outro) li_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quantityselector.$$.fragment, local);

    			if (local) {
    				li_outro = create_out_transition(li, fly, { x: 30, duration: 250 });
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(quantityselector);
    			if (detaching && li_outro) li_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductItem", slots, []);
    	let { name } = $$props;
    	let { quantity } = $$props;
    	let { price } = $$props;
    	let { image } = $$props;
    	let { id } = $$props;
    	let { taxRate } = $$props;

    	function handleQuantityChange(event) {
    		let _id = event.detail.id;
    		let _quantity = event.detail.quantity;

    		BasketStore.update(currentState => {
    			let oldState = [...currentState];
    			let productIndex = oldState.findIndex(product => product.id === _id);
    			let modifiedProduct = oldState[productIndex];
    			modifiedProduct.quantity = _quantity;
    			oldState[productIndex] = modifiedProduct;
    			return oldState;
    		});
    	}

    	function handleProductRemove() {
    		BasketStore.update(currentState => {
    			return currentState.filter(product => product.id != id);
    		});
    	}

    	const writable_props = ["name", "quantity", "price", "image", "id", "taxRate"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProductItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("quantity" in $$props) $$invalidate(1, quantity = $$props.quantity);
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("taxRate" in $$props) $$invalidate(5, taxRate = $$props.taxRate);
    	};

    	$$self.$capture_state = () => ({
    		QuantitySelector,
    		BasketStore,
    		fly,
    		name,
    		quantity,
    		price,
    		image,
    		id,
    		taxRate,
    		handleQuantityChange,
    		handleProductRemove
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("quantity" in $$props) $$invalidate(1, quantity = $$props.quantity);
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("taxRate" in $$props) $$invalidate(5, taxRate = $$props.taxRate);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		quantity,
    		price,
    		image,
    		id,
    		taxRate,
    		handleQuantityChange,
    		handleProductRemove
    	];
    }

    class ProductItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			name: 0,
    			quantity: 1,
    			price: 2,
    			image: 3,
    			id: 4,
    			taxRate: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductItem",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<ProductItem> was created without expected prop 'name'");
    		}

    		if (/*quantity*/ ctx[1] === undefined && !("quantity" in props)) {
    			console.warn("<ProductItem> was created without expected prop 'quantity'");
    		}

    		if (/*price*/ ctx[2] === undefined && !("price" in props)) {
    			console.warn("<ProductItem> was created without expected prop 'price'");
    		}

    		if (/*image*/ ctx[3] === undefined && !("image" in props)) {
    			console.warn("<ProductItem> was created without expected prop 'image'");
    		}

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<ProductItem> was created without expected prop 'id'");
    		}

    		if (/*taxRate*/ ctx[5] === undefined && !("taxRate" in props)) {
    			console.warn("<ProductItem> was created without expected prop 'taxRate'");
    		}
    	}

    	get name() {
    		throw new Error("<ProductItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<ProductItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get quantity() {
    		throw new Error("<ProductItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set quantity(value) {
    		throw new Error("<ProductItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<ProductItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<ProductItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image() {
    		throw new Error("<ProductItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ProductItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<ProductItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ProductItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get taxRate() {
    		throw new Error("<ProductItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set taxRate(value) {
    		throw new Error("<ProductItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const randomNumber = (n, m) => Math.floor((Math.random() * m) + n);

    const data$1 = [
        {
            id: 0,
            name: 'Apple M1 Chip with 8-Core CPU and 7-Core GPU256GB Storage',
            price: 999.00,
            taxRate: 0.23,
            quantity: randomNumber(1,6),
            image: 'macbook-air-space-gray-select-201810.jpg'
        },{
            id: 1,
            name: 'Apple Watch Blue Aluminum Case with Solo Loop',
            price: 399.00,
            taxRate: 0.23,
            quantity: randomNumber(1,6),
            image: 'MJHL3ref_VW_34FR+watch-44-alum-blue-nc-6s_VW_34FR_WF_CO.jpg'
        },{
            id: 2,
            name: 'Apple Mac Mini M1 Chip with 8-Core CPU and 8-Core GPU 256GB Storage',
            price: 699.00,
            taxRate: 0.23,
            quantity: randomNumber(1,6),
            image: 'mac-mini-hero-202011.jpg'
        },{
            id: 3,
            name: 'Apple AirTag',
            price: 29.00,
            taxRate: 0.13,
            quantity: randomNumber(1,6),
            image: 'airtag-double-select-202104.jpg'
        },{
            id: 4,
            name: 'Apple iMac M1 Chip with 8-Core CPU and 7-Core GPU 256GB Storage',
            price: 1299.00,
            taxRate: 0.19,
            quantity: randomNumber(1,6),
            image: 'imac-24-blue-selection-hero-202104.jpg'
        },{
            id: 5,
            name: 'Apple 16-inch MacBook Pro 2.3GHz 8-Core Processor 1TB Storage AMD Radeon Pro 5500M',
            price: 2799.00,
            taxRate: 0.20,
            quantity: randomNumber(1,6),
            image: 'mbp16touch-space-select-201911.jpg'
        },{
            id: 6,
            name: 'Pro Display XDR',
            price: 4999.00,
            taxRate: 0.13,
            quantity: randomNumber(1,6),
            image: 'pro-display-hero.jpg'
        }
    ];

    const pickRandomProducts = () => {
        const itemsCount = randomNumber(1, data$1.length - 1);
        const randomProducts = data$1.sort(() => .5 - Math.random()).slice(0,itemsCount);
        return randomProducts;
    };

    const fetchProducts = () => {
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                resolve(pickRandomProducts());
            }, Math.random() * 1000);
        });
    };

    /* src/componentes/basket/ProductList.svelte generated by Svelte v3.37.0 */
    const file$9 = "src/componentes/basket/ProductList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (26:0) {:catch error}
    function create_catch_block(ctx) {
    	let p;
    	let t_value = /*error*/ ctx[7].message + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    			add_location(p, file$9, 26, 1, 591);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*promise*/ 2 && t_value !== (t_value = /*error*/ ctx[7].message + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(26:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import ProductItem from './ProductItem.svelte';     import { BasketStore }
    function create_then_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(1:0) <script>     import ProductItem from './ProductItem.svelte';     import { BasketStore }",
    		ctx
    	});

    	return block;
    }

    // (24:16)      <p>waiting...</p> {:catch error}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "waiting...";
    			add_location(p, file$9, 24, 4, 557);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(24:16)      <p>waiting...</p> {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (36:0) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Your cart is empty";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Generate cart";
    			add_location(p, file$9, 36, 4, 834);
    			add_location(button, file$9, 37, 4, 864);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleGetCart*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(36:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:0) {#if products && products.length}
    function create_if_block$6(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*products*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*prodcut*/ ctx[4].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "product-list svelte-1piv6w1");
    			add_location(ul, file$9, 30, 4, 681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*products*/ 1) {
    				each_value = /*products*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(30:0) {#if products && products.length}",
    		ctx
    	});

    	return block;
    }

    // (32:8) {#each products as prodcut (prodcut.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let productitem;
    	let current;
    	const productitem_spread_levels = [/*prodcut*/ ctx[4]];
    	let productitem_props = {};

    	for (let i = 0; i < productitem_spread_levels.length; i += 1) {
    		productitem_props = assign(productitem_props, productitem_spread_levels[i]);
    	}

    	productitem = new ProductItem({ props: productitem_props, $$inline: true });

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(productitem.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(productitem, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const productitem_changes = (dirty & /*products*/ 1)
    			? get_spread_update(productitem_spread_levels, [get_spread_object(/*prodcut*/ ctx[4])])
    			: {};

    			productitem.$set(productitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(productitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(productitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(productitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(32:8) {#each products as prodcut (prodcut.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let promise_1;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		error: 7
    	};

    	handle_promise(promise_1 = /*promise*/ ctx[1], info);
    	const if_block_creators = [create_if_block$6, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*products*/ ctx[0] && /*products*/ ctx[0].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			info.block.c();
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t.parentNode;
    			info.anchor = t;
    			insert_dev(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*promise*/ 2 && promise_1 !== (promise_1 = /*promise*/ ctx[1]) && handle_promise(promise_1, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[7] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductList", slots, []);
    	let products;
    	let promise;
    	BasketStore.subscribe(store => $$invalidate(0, products = store));

    	async function handleGetCart() {
    		$$invalidate(1, promise = getProducts());
    	}

    	async function getProducts() {
    		let response = await fetchProducts();
    		$$invalidate(0, products = response);
    		BasketStore.update(store => response);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProductList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		ProductItem,
    		BasketStore,
    		fetchProducts,
    		products,
    		promise,
    		handleGetCart,
    		getProducts
    	});

    	$$self.$inject_state = $$props => {
    		if ("products" in $$props) $$invalidate(0, products = $$props.products);
    		if ("promise" in $$props) $$invalidate(1, promise = $$props.promise);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [products, promise, handleGetCart];
    }

    class ProductList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductList",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/componentes/basket/Totals.svelte generated by Svelte v3.37.0 */
    const file$8 = "src/componentes/basket/Totals.svelte";

    // (30:0) {#if products && products.length}
    function create_if_block$5(ctx) {
    	let div4;
    	let h4;
    	let t1;
    	let div3;
    	let div0;
    	let t2;
    	let span0;
    	let t3_value = /*totals*/ ctx[2].qty + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let span1;
    	let t6_value = /*totals*/ ctx[2].price.toFixed(2) + "";
    	let t6;
    	let t7;
    	let t8;
    	let div2;
    	let t9;
    	let span2;
    	let t10_value = /*totals*/ ctx[2].taxPrice.toFixed(2) + "";
    	let t10;
    	let t11;
    	let t12;
    	let if_block = /*deliveryCost*/ ctx[0] >= 0 && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			h4 = element("h4");
    			h4.textContent = "Summary:";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t2 = text("Products quantity: ");
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");
    			t5 = text("Taxes excluded: ");
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = text(" USD");
    			t8 = space();
    			div2 = element("div");
    			t9 = text("Taxes included: ");
    			span2 = element("span");
    			t10 = text(t10_value);
    			t11 = text(" USD");
    			t12 = space();
    			if (if_block) if_block.c();
    			attr_dev(h4, "class", "svelte-189u4v8");
    			add_location(h4, file$8, 31, 8, 916);
    			attr_dev(span0, "class", "svelte-189u4v8");
    			add_location(span0, file$8, 34, 35, 1041);
    			attr_dev(div0, "class", "totals__qty svelte-189u4v8");
    			add_location(div0, file$8, 33, 12, 980);
    			attr_dev(span1, "class", "svelte-189u4v8");
    			add_location(span1, file$8, 37, 32, 1160);
    			attr_dev(div1, "class", "totals__tax-exl svelte-189u4v8");
    			add_location(div1, file$8, 36, 12, 1098);
    			attr_dev(span2, "class", "svelte-189u4v8");
    			add_location(span2, file$8, 40, 32, 1298);
    			attr_dev(div2, "class", "totals__tax-inc svelte-189u4v8");
    			add_location(div2, file$8, 39, 12, 1236);
    			attr_dev(div3, "class", "totals-grid svelte-189u4v8");
    			add_location(div3, file$8, 32, 8, 942);
    			attr_dev(div4, "class", "totals svelte-189u4v8");
    			add_location(div4, file$8, 30, 4, 887);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h4);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t2);
    			append_dev(div0, span0);
    			append_dev(span0, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			append_dev(div1, t5);
    			append_dev(div1, span1);
    			append_dev(span1, t6);
    			append_dev(span1, t7);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, t9);
    			append_dev(div2, span2);
    			append_dev(span2, t10);
    			append_dev(span2, t11);
    			append_dev(div3, t12);
    			if (if_block) if_block.m(div3, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*totals*/ 4 && t3_value !== (t3_value = /*totals*/ ctx[2].qty + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*totals*/ 4 && t6_value !== (t6_value = /*totals*/ ctx[2].price.toFixed(2) + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*totals*/ 4 && t10_value !== (t10_value = /*totals*/ ctx[2].taxPrice.toFixed(2) + "")) set_data_dev(t10, t10_value);

    			if (/*deliveryCost*/ ctx[0] >= 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(30:0) {#if products && products.length}",
    		ctx
    	});

    	return block;
    }

    // (43:12) {#if deliveryCost >= 0}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*deliveryCost*/ ctx[0].toFixed(2) + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Delivery: ");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text(" USD");
    			attr_dev(span, "class", "svelte-189u4v8");
    			add_location(span, file$8, 44, 30, 1478);
    			attr_dev(div, "class", "totals__delivery svelte-189u4v8");
    			add_location(div, file$8, 43, 16, 1417);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deliveryCost*/ 1 && t1_value !== (t1_value = /*deliveryCost*/ ctx[0].toFixed(2) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(43:12) {#if deliveryCost >= 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*products*/ ctx[1] && /*products*/ ctx[1].length && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*products*/ ctx[1] && /*products*/ ctx[1].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let totals;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Totals", slots, []);
    	let { deliveryCost = undefined } = $$props;
    	let products;
    	BasketStore.subscribe(data => $$invalidate(1, products = data));

    	function calculateTotals(products) {
    		let tempTotals = { qty: 0, price: 0, taxPrice: 0 };

    		if (products) {
    			products.forEach(el => {
    				tempTotals.qty += el.quantity;
    				tempTotals.price += el.price * el.quantity;
    				tempTotals.taxPrice += el.price * el.quantity * (1 + el.taxRate);
    			});

    			tempTotals.price += parseFloat(deliveryCost) || 0;
    			tempTotals.taxPrice += parseFloat(deliveryCost) || 0;
    		}

    		return tempTotals;
    	}

    	const writable_props = ["deliveryCost"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Totals> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("deliveryCost" in $$props) $$invalidate(0, deliveryCost = $$props.deliveryCost);
    	};

    	$$self.$capture_state = () => ({
    		BasketStore,
    		deliveryCost,
    		products,
    		calculateTotals,
    		totals
    	});

    	$$self.$inject_state = $$props => {
    		if ("deliveryCost" in $$props) $$invalidate(0, deliveryCost = $$props.deliveryCost);
    		if ("products" in $$props) $$invalidate(1, products = $$props.products);
    		if ("totals" in $$props) $$invalidate(2, totals = $$props.totals);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*products, deliveryCost*/ 3) {
    			$$invalidate(2, totals = calculateTotals(products));
    		}
    	};

    	return [deliveryCost, products, totals];
    }

    class Totals extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { deliveryCost: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Totals",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get deliveryCost() {
    		throw new Error("<Totals>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set deliveryCost(value) {
    		throw new Error("<Totals>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componentes/basket/BasketSubmit.svelte generated by Svelte v3.37.0 */
    const file$7 = "src/componentes/basket/BasketSubmit.svelte";

    // (13:0) {#if products && products.length}
    function create_if_block$4(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Continue";
    			attr_dev(button, "class", "svelte-966t1y");
    			add_location(button, file$7, 14, 8, 375);
    			attr_dev(div, "class", "basket-actions svelte-966t1y");
    			add_location(div, file$7, 13, 4, 299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", prevent_default(/*handleSubmit*/ ctx[1]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(13:0) {#if products && products.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*products*/ ctx[0] && /*products*/ ctx[0].length && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*products*/ ctx[0] && /*products*/ ctx[0].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BasketSubmit", slots, []);
    	let products;
    	BasketStore.subscribe(store => $$invalidate(0, products = store));

    	function handleSubmit() {
    		push("/summary");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BasketSubmit> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		BasketStore,
    		push,
    		products,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("products" in $$props) $$invalidate(0, products = $$props.products);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [products, handleSubmit];
    }

    class BasketSubmit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BasketSubmit",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/pages/Basket.svelte generated by Svelte v3.37.0 */
    const file$6 = "src/pages/Basket.svelte";

    function create_fragment$7(ctx) {
    	let h3;
    	let t1;
    	let productlist;
    	let t2;
    	let totals;
    	let t3;
    	let basketsubmit;
    	let current;
    	productlist = new ProductList({ $$inline: true });
    	totals = new Totals({ $$inline: true });
    	basketsubmit = new BasketSubmit({ $$inline: true });

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Your cart:";
    			t1 = space();
    			create_component(productlist.$$.fragment);
    			t2 = space();
    			create_component(totals.$$.fragment);
    			t3 = space();
    			create_component(basketsubmit.$$.fragment);
    			attr_dev(h3, "class", "highlighted");
    			add_location(h3, file$6, 7, 0, 229);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(productlist, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(totals, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(basketsubmit, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(productlist.$$.fragment, local);
    			transition_in(totals.$$.fragment, local);
    			transition_in(basketsubmit.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(productlist.$$.fragment, local);
    			transition_out(totals.$$.fragment, local);
    			transition_out(basketsubmit.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(productlist, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(totals, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(basketsubmit, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Basket", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Basket> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ProductList, Totals, BasketSubmit });
    	return [];
    }

    class Basket extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Basket",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/pages/Home.svelte generated by Svelte v3.37.0 */
    const file$5 = "src/pages/Home.svelte";

    function create_fragment$6(ctx) {
    	let h4;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Nothing here...";
    			add_location(h4, file$5, 5, 0, 84);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	push("/basket");
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ push });
    	return [];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const data = [
        {
            id: 0,
            name: 'Standard',
            price: 0
        },{
            id: 1,
            name: 'UPS',
            price: 3.99
        },{
            id: 2,
            name: 'Express delivery',
            price: 5.90,
        }
    ];


    const fetchDeliveryMethods = () => {
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                resolve(data);
            }, Math.random() * 1000);
        });
    };

    /* src/componentes/checkout/DeliveryMethods.svelte generated by Svelte v3.37.0 */
    const file$4 = "src/componentes/checkout/DeliveryMethods.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (28:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "...";
    			attr_dev(p, "class", "svelte-4v7l0w");
    			add_location(p, file$4, 28, 4, 994);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(28:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:0) {#if deliveryMethods?.length}
    function create_if_block$3(ctx) {
    	let form;
    	let each_value = /*deliveryMethods*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			form = element("form");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(form, "class", "delivery-form svelte-4v7l0w");
    			add_location(form, file$4, 14, 4, 342);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(form, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deliveryMethods, selected*/ 3) {
    				each_value = /*deliveryMethods*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(form, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(14:0) {#if deliveryMethods?.length}",
    		ctx
    	});

    	return block;
    }

    // (21:20) {#if method.price == 0}
    function create_if_block_1$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "FREE";
    			attr_dev(span, "class", "delivery-label svelte-4v7l0w");
    			add_location(span, file$4, 21, 24, 843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(21:20) {#if method.price == 0}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {#each deliveryMethods as method}
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t0;
    	let label;
    	let t1_value = /*method*/ ctx[4].name + "";
    	let t1;
    	let t2;
    	let span;
    	let t3_value = `${/*method*/ ctx[4].price.toFixed(2)} USD` + "";
    	let t3;
    	let t4;
    	let label_for_value;
    	let t5;
    	let mounted;
    	let dispose;
    	let if_block = /*method*/ ctx[4].price == 0 && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			span = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			attr_dev(input, "type", "radio");
    			attr_dev(input, "id", input_id_value = `delivery-${/*method*/ ctx[4].id}`);
    			attr_dev(input, "name", "deliveryMethod");
    			input.__value = input_value_value = /*method*/ ctx[4].price;
    			input.value = input.__value;
    			attr_dev(input, "class", "svelte-4v7l0w");
    			/*$$binding_groups*/ ctx[3][0].push(input);
    			add_location(input, file$4, 17, 16, 471);
    			attr_dev(span, "class", "delivery-method__price svelte-4v7l0w");
    			add_location(span, file$4, 19, 34, 694);
    			attr_dev(label, "for", label_for_value = `delivery-${/*method*/ ctx[4].id}`);
    			attr_dev(label, "class", "radio-label svelte-4v7l0w");
    			add_location(label, file$4, 18, 16, 602);
    			attr_dev(div, "class", "delivery-method svelte-4v7l0w");
    			add_location(div, file$4, 16, 12, 425);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			input.checked = input.__value === /*selected*/ ctx[1];
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, span);
    			append_dev(span, t3);
    			append_dev(label, t4);
    			if (if_block) if_block.m(label, null);
    			append_dev(div, t5);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*deliveryMethods*/ 1 && input_id_value !== (input_id_value = `delivery-${/*method*/ ctx[4].id}`)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*deliveryMethods*/ 1 && input_value_value !== (input_value_value = /*method*/ ctx[4].price)) {
    				prop_dev(input, "__value", input_value_value);
    				input.value = input.__value;
    			}

    			if (dirty & /*selected*/ 2) {
    				input.checked = input.__value === /*selected*/ ctx[1];
    			}

    			if (dirty & /*deliveryMethods*/ 1 && t1_value !== (t1_value = /*method*/ ctx[4].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*deliveryMethods*/ 1 && t3_value !== (t3_value = `${/*method*/ ctx[4].price.toFixed(2)} USD` + "")) set_data_dev(t3, t3_value);

    			if (/*method*/ ctx[4].price == 0) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(label, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*deliveryMethods*/ 1 && label_for_value !== (label_for_value = `delivery-${/*method*/ ctx[4].id}`)) {
    				attr_dev(label, "for", label_for_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*$$binding_groups*/ ctx[3][0].splice(/*$$binding_groups*/ ctx[3][0].indexOf(input), 1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(16:8) {#each deliveryMethods as method}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let t;
    	let totals;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*deliveryMethods*/ ctx[0]?.length) return create_if_block$3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	totals = new Totals({
    			props: { deliveryCost: /*selected*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			if_block.c();
    			t = space();
    			create_component(totals.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(totals, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			}

    			const totals_changes = {};
    			if (dirty & /*selected*/ 2) totals_changes.deliveryCost = /*selected*/ ctx[1];
    			totals.$set(totals_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(totals.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(totals.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(totals, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DeliveryMethods", slots, []);
    	let deliveryMethods;
    	let selected;

    	onMount(async () => {
    		$$invalidate(0, deliveryMethods = await fetchDeliveryMethods());
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DeliveryMethods> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		selected = this.__value;
    		$$invalidate(1, selected);
    	}

    	$$self.$capture_state = () => ({
    		fetchDeliveryMethods,
    		onMount,
    		Totals,
    		deliveryMethods,
    		selected
    	});

    	$$self.$inject_state = $$props => {
    		if ("deliveryMethods" in $$props) $$invalidate(0, deliveryMethods = $$props.deliveryMethods);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [deliveryMethods, selected, input_change_handler, $$binding_groups];
    }

    class DeliveryMethods extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DeliveryMethods",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const AddressStore = writable({
        shipping: {},
        billing: {}
    });

    /* src/componentes/checkout/AddressForm.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/componentes/checkout/AddressForm.svelte";

    function create_fragment$4(ctx) {
    	let form;
    	let label0;
    	let t0;
    	let label0_for_value;
    	let t1;
    	let input0;
    	let input0_id_value;
    	let t2;
    	let label1;
    	let t3;
    	let label1_for_value;
    	let t4;
    	let input1;
    	let input1_id_value;
    	let t5;
    	let label2;
    	let t6;
    	let label2_for_value;
    	let t7;
    	let input2;
    	let input2_id_value;
    	let t8;
    	let label3;
    	let t9;
    	let label3_for_value;
    	let t10;
    	let input3;
    	let input3_id_value;
    	let t11;
    	let label4;
    	let t12;
    	let label4_for_value;
    	let t13;
    	let input4;
    	let input4_id_value;
    	let t14;
    	let label5;
    	let t15;
    	let label5_for_value;
    	let t16;
    	let input5;
    	let input5_id_value;
    	let t17;
    	let input6;
    	let form_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			t0 = text("Firstname:");
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			t3 = text("Lastname:");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("City:");
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			label3 = element("label");
    			t9 = text("Postcode:");
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			label4 = element("label");
    			t12 = text("Street address:");
    			t13 = space();
    			input4 = element("input");
    			t14 = space();
    			label5 = element("label");
    			t15 = text("Street address:");
    			t16 = space();
    			input5 = element("input");
    			t17 = space();
    			input6 = element("input");
    			attr_dev(label0, "for", label0_for_value = `${/*type*/ ctx[1]}-firstName`);
    			attr_dev(label0, "class", "svelte-1k1rrua");
    			add_location(label0, file$3, 54, 2, 1109);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", input0_id_value = `${/*type*/ ctx[1]}-firstName`);
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1k1rrua");
    			add_location(input0, file$3, 55, 2, 1164);
    			attr_dev(label1, "for", label1_for_value = `${/*type*/ ctx[1]}-lastName`);
    			attr_dev(label1, "class", "svelte-1k1rrua");
    			add_location(label1, file$3, 62, 2, 1272);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", input1_id_value = `${/*type*/ ctx[1]}-lastName`);
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1k1rrua");
    			add_location(input1, file$3, 63, 2, 1325);
    			attr_dev(label2, "for", label2_for_value = `${/*type*/ ctx[1]}-city`);
    			attr_dev(label2, "class", "svelte-1k1rrua");
    			add_location(label2, file$3, 70, 2, 1431);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "id", input2_id_value = `${/*type*/ ctx[1]}-city`);
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-1k1rrua");
    			add_location(input2, file$3, 71, 2, 1476);
    			attr_dev(label3, "for", label3_for_value = `${/*type*/ ctx[1]}-postcode`);
    			attr_dev(label3, "class", "svelte-1k1rrua");
    			add_location(label3, file$3, 73, 2, 1556);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "id", input3_id_value = `${/*type*/ ctx[1]}-postcode`);
    			input3.required = true;
    			attr_dev(input3, "class", "svelte-1k1rrua");
    			add_location(input3, file$3, 74, 2, 1609);
    			attr_dev(label4, "for", label4_for_value = `${/*type*/ ctx[1]}-streetFirstLine`);
    			attr_dev(label4, "class", "svelte-1k1rrua");
    			add_location(label4, file$3, 81, 2, 1715);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "id", input4_id_value = `${/*type*/ ctx[1]}-streetFirstLine`);
    			input4.required = true;
    			attr_dev(input4, "class", "svelte-1k1rrua");
    			add_location(input4, file$3, 82, 2, 1781);
    			attr_dev(label5, "for", label5_for_value = `${/*type*/ ctx[1]}-streetSecondLine`);
    			attr_dev(label5, "class", "svelte-1k1rrua");
    			add_location(label5, file$3, 89, 2, 1901);
    			attr_dev(input5, "type", "text");
    			attr_dev(input5, "id", input5_id_value = `${/*type*/ ctx[1]}-streetSecondLine`);
    			attr_dev(input5, "class", "svelte-1k1rrua");
    			add_location(input5, file$3, 90, 2, 1968);
    			attr_dev(input6, "type", "submit");
    			input6.value = "Confirm";
    			input6.disabled = /*buttonDisabled*/ ctx[2];
    			attr_dev(input6, "class", "svelte-1k1rrua");
    			add_location(input6, file$3, 95, 2, 2076);
    			attr_dev(form, "id", form_id_value = `${/*type*/ ctx[1]}-form`);
    			add_location(form, file$3, 49, 0, 993);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(label0, t0);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			set_input_value(input0, /*address*/ ctx[0].firstName);
    			append_dev(form, t2);
    			append_dev(form, label1);
    			append_dev(label1, t3);
    			append_dev(form, t4);
    			append_dev(form, input1);
    			set_input_value(input1, /*address*/ ctx[0].lastName);
    			append_dev(form, t5);
    			append_dev(form, label2);
    			append_dev(label2, t6);
    			append_dev(form, t7);
    			append_dev(form, input2);
    			set_input_value(input2, /*address*/ ctx[0].city);
    			append_dev(form, t8);
    			append_dev(form, label3);
    			append_dev(label3, t9);
    			append_dev(form, t10);
    			append_dev(form, input3);
    			set_input_value(input3, /*address*/ ctx[0].postcode);
    			append_dev(form, t11);
    			append_dev(form, label4);
    			append_dev(label4, t12);
    			append_dev(form, t13);
    			append_dev(form, input4);
    			set_input_value(input4, /*address*/ ctx[0].streetFirstLine);
    			append_dev(form, t14);
    			append_dev(form, label5);
    			append_dev(label5, t15);
    			append_dev(form, t16);
    			append_dev(form, input5);
    			set_input_value(input5, /*address*/ ctx[0].streetSecondLine);
    			append_dev(form, t17);
    			append_dev(form, input6);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[9]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[10]),
    					listen_dev(form, "input", /*handleFormValueChanged*/ ctx[3], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*handleFormSubmited*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*type*/ 2 && label0_for_value !== (label0_for_value = `${/*type*/ ctx[1]}-firstName`)) {
    				attr_dev(label0, "for", label0_for_value);
    			}

    			if (dirty & /*type*/ 2 && input0_id_value !== (input0_id_value = `${/*type*/ ctx[1]}-firstName`)) {
    				attr_dev(input0, "id", input0_id_value);
    			}

    			if (dirty & /*address*/ 1 && input0.value !== /*address*/ ctx[0].firstName) {
    				set_input_value(input0, /*address*/ ctx[0].firstName);
    			}

    			if (dirty & /*type*/ 2 && label1_for_value !== (label1_for_value = `${/*type*/ ctx[1]}-lastName`)) {
    				attr_dev(label1, "for", label1_for_value);
    			}

    			if (dirty & /*type*/ 2 && input1_id_value !== (input1_id_value = `${/*type*/ ctx[1]}-lastName`)) {
    				attr_dev(input1, "id", input1_id_value);
    			}

    			if (dirty & /*address*/ 1 && input1.value !== /*address*/ ctx[0].lastName) {
    				set_input_value(input1, /*address*/ ctx[0].lastName);
    			}

    			if (dirty & /*type*/ 2 && label2_for_value !== (label2_for_value = `${/*type*/ ctx[1]}-city`)) {
    				attr_dev(label2, "for", label2_for_value);
    			}

    			if (dirty & /*type*/ 2 && input2_id_value !== (input2_id_value = `${/*type*/ ctx[1]}-city`)) {
    				attr_dev(input2, "id", input2_id_value);
    			}

    			if (dirty & /*address*/ 1 && input2.value !== /*address*/ ctx[0].city) {
    				set_input_value(input2, /*address*/ ctx[0].city);
    			}

    			if (dirty & /*type*/ 2 && label3_for_value !== (label3_for_value = `${/*type*/ ctx[1]}-postcode`)) {
    				attr_dev(label3, "for", label3_for_value);
    			}

    			if (dirty & /*type*/ 2 && input3_id_value !== (input3_id_value = `${/*type*/ ctx[1]}-postcode`)) {
    				attr_dev(input3, "id", input3_id_value);
    			}

    			if (dirty & /*address*/ 1 && input3.value !== /*address*/ ctx[0].postcode) {
    				set_input_value(input3, /*address*/ ctx[0].postcode);
    			}

    			if (dirty & /*type*/ 2 && label4_for_value !== (label4_for_value = `${/*type*/ ctx[1]}-streetFirstLine`)) {
    				attr_dev(label4, "for", label4_for_value);
    			}

    			if (dirty & /*type*/ 2 && input4_id_value !== (input4_id_value = `${/*type*/ ctx[1]}-streetFirstLine`)) {
    				attr_dev(input4, "id", input4_id_value);
    			}

    			if (dirty & /*address*/ 1 && input4.value !== /*address*/ ctx[0].streetFirstLine) {
    				set_input_value(input4, /*address*/ ctx[0].streetFirstLine);
    			}

    			if (dirty & /*type*/ 2 && label5_for_value !== (label5_for_value = `${/*type*/ ctx[1]}-streetSecondLine`)) {
    				attr_dev(label5, "for", label5_for_value);
    			}

    			if (dirty & /*type*/ 2 && input5_id_value !== (input5_id_value = `${/*type*/ ctx[1]}-streetSecondLine`)) {
    				attr_dev(input5, "id", input5_id_value);
    			}

    			if (dirty & /*address*/ 1 && input5.value !== /*address*/ ctx[0].streetSecondLine) {
    				set_input_value(input5, /*address*/ ctx[0].streetSecondLine);
    			}

    			if (dirty & /*buttonDisabled*/ 4) {
    				prop_dev(input6, "disabled", /*buttonDisabled*/ ctx[2]);
    			}

    			if (dirty & /*type*/ 2 && form_id_value !== (form_id_value = `${/*type*/ ctx[1]}-form`)) {
    				attr_dev(form, "id", form_id_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AddressForm", slots, []);
    	let { address } = $$props;
    	let { type } = $$props;
    	let buttonDisabled = !checkFormValid();
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		$$invalidate(2, buttonDisabled = !checkFormValid());
    	});

    	function handleFormValueChanged(e) {
    		AddressStore.update(store => {
    			let oldStore = store;
    			let _type = type.toLowerCase();
    			oldStore[_type] = address;
    			return oldStore;
    		});

    		updateSubmitButtonState();
    	}

    	function updateSubmitButtonState() {
    		if (checkFormValid()) {
    			$$invalidate(2, buttonDisabled = false);
    		} else {
    			$$invalidate(2, buttonDisabled = true);
    		}
    	}

    	function checkFormValid() {
    		let form = document.getElementById(`${type}-form`);

    		if (form) {
    			return form.checkValidity();
    		}

    		return false;
    	}

    	function handleFormSubmited() {
    		dispatch("filled", { form: type.toLowerCase() });
    	}

    	const writable_props = ["address", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddressForm> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		address.firstName = this.value;
    		$$invalidate(0, address);
    	}

    	function input1_input_handler() {
    		address.lastName = this.value;
    		$$invalidate(0, address);
    	}

    	function input2_input_handler() {
    		address.city = this.value;
    		$$invalidate(0, address);
    	}

    	function input3_input_handler() {
    		address.postcode = this.value;
    		$$invalidate(0, address);
    	}

    	function input4_input_handler() {
    		address.streetFirstLine = this.value;
    		$$invalidate(0, address);
    	}

    	function input5_input_handler() {
    		address.streetSecondLine = this.value;
    		$$invalidate(0, address);
    	}

    	$$self.$$set = $$props => {
    		if ("address" in $$props) $$invalidate(0, address = $$props.address);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		AddressStore,
    		address,
    		type,
    		buttonDisabled,
    		dispatch,
    		handleFormValueChanged,
    		updateSubmitButtonState,
    		checkFormValid,
    		handleFormSubmited
    	});

    	$$self.$inject_state = $$props => {
    		if ("address" in $$props) $$invalidate(0, address = $$props.address);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("buttonDisabled" in $$props) $$invalidate(2, buttonDisabled = $$props.buttonDisabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		address,
    		type,
    		buttonDisabled,
    		handleFormValueChanged,
    		handleFormSubmited,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	];
    }

    class AddressForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { address: 0, type: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddressForm",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*address*/ ctx[0] === undefined && !("address" in props)) {
    			console.warn("<AddressForm> was created without expected prop 'address'");
    		}

    		if (/*type*/ ctx[1] === undefined && !("type" in props)) {
    			console.warn("<AddressForm> was created without expected prop 'type'");
    		}
    	}

    	get address() {
    		throw new Error("<AddressForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<AddressForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<AddressForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<AddressForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componentes/checkout/AddressPreview.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/componentes/checkout/AddressPreview.svelte";

    // (16:0) {#if address}
    function create_if_block$2(ctx) {
    	let div;
    	let strong;
    	let t0_value = (/*address*/ ctx[2].firstName || "") + "";
    	let t0;
    	let t1;
    	let t2_value = (/*address*/ ctx[2].lastName || "") + "";
    	let t2;
    	let t3;
    	let br;
    	let t4;
    	let p0;
    	let t5_value = (/*address*/ ctx[2].city || "") + "";
    	let t5;
    	let t6;
    	let t7_value = (/*address*/ ctx[2].postcode || "") + "";
    	let t7;
    	let t8;
    	let p1;
    	let t9_value = (/*address*/ ctx[2].streetFirstLine || "") + "";
    	let t9;
    	let t10;
    	let p2;
    	let t11_value = (/*address*/ ctx[2].streetSecondLine || "") + "";
    	let t11;
    	let t12;
    	let if_block = /*filled*/ ctx[0] && !/*update*/ ctx[1] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			strong = element("strong");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			p0 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			t7 = text(t7_value);
    			t8 = space();
    			p1 = element("p");
    			t9 = text(t9_value);
    			t10 = space();
    			p2 = element("p");
    			t11 = text(t11_value);
    			t12 = space();
    			if (if_block) if_block.c();
    			attr_dev(strong, "class", "svelte-1q4a0lr");
    			add_location(strong, file$2, 17, 8, 347);
    			attr_dev(br, "class", "svelte-1q4a0lr");
    			add_location(br, file$2, 19, 17, 436);
    			attr_dev(p0, "class", "svelte-1q4a0lr");
    			add_location(p0, file$2, 20, 8, 449);
    			attr_dev(p1, "class", "svelte-1q4a0lr");
    			add_location(p1, file$2, 21, 8, 510);
    			attr_dev(p2, "class", "svelte-1q4a0lr");
    			add_location(p2, file$2, 22, 8, 557);
    			attr_dev(div, "class", "address-preview svelte-1q4a0lr");
    			add_location(div, file$2, 16, 4, 309);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, strong);
    			append_dev(strong, t0);
    			append_dev(strong, t1);
    			append_dev(strong, t2);
    			append_dev(strong, t3);
    			append_dev(div, br);
    			append_dev(div, t4);
    			append_dev(div, p0);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(div, t8);
    			append_dev(div, p1);
    			append_dev(p1, t9);
    			append_dev(div, t10);
    			append_dev(div, p2);
    			append_dev(p2, t11);
    			append_dev(div, t12);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*address*/ 4 && t0_value !== (t0_value = (/*address*/ ctx[2].firstName || "") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*address*/ 4 && t2_value !== (t2_value = (/*address*/ ctx[2].lastName || "") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*address*/ 4 && t5_value !== (t5_value = (/*address*/ ctx[2].city || "") + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*address*/ 4 && t7_value !== (t7_value = (/*address*/ ctx[2].postcode || "") + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*address*/ 4 && t9_value !== (t9_value = (/*address*/ ctx[2].streetFirstLine || "") + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*address*/ 4 && t11_value !== (t11_value = (/*address*/ ctx[2].streetSecondLine || "") + "")) set_data_dev(t11, t11_value);

    			if (/*filled*/ ctx[0] && !/*update*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(16:0) {#if address}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {#if filled && !update}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "edit";
    			attr_dev(button, "class", "svelte-1q4a0lr");
    			add_location(button, file$2, 24, 12, 640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleEditAddress*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:8) {#if filled && !update}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*address*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*address*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AddressPreview", slots, []);
    	let { filled } = $$props;
    	let { update } = $$props;
    	let { address } = $$props;
    	const dispatch = createEventDispatcher();

    	function handleEditAddress() {
    		dispatch("update", { update });
    	}

    	const writable_props = ["filled", "update", "address"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddressPreview> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    		if ("update" in $$props) $$invalidate(1, update = $$props.update);
    		if ("address" in $$props) $$invalidate(2, address = $$props.address);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		filled,
    		update,
    		address,
    		dispatch,
    		handleEditAddress
    	});

    	$$self.$inject_state = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    		if ("update" in $$props) $$invalidate(1, update = $$props.update);
    		if ("address" in $$props) $$invalidate(2, address = $$props.address);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filled, update, address, handleEditAddress];
    }

    class AddressPreview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { filled: 0, update: 1, address: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddressPreview",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filled*/ ctx[0] === undefined && !("filled" in props)) {
    			console.warn("<AddressPreview> was created without expected prop 'filled'");
    		}

    		if (/*update*/ ctx[1] === undefined && !("update" in props)) {
    			console.warn("<AddressPreview> was created without expected prop 'update'");
    		}

    		if (/*address*/ ctx[2] === undefined && !("address" in props)) {
    			console.warn("<AddressPreview> was created without expected prop 'address'");
    		}
    	}

    	get filled() {
    		throw new Error("<AddressPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filled(value) {
    		throw new Error("<AddressPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get update() {
    		throw new Error("<AddressPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set update(value) {
    		throw new Error("<AddressPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get address() {
    		throw new Error("<AddressPreview>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<AddressPreview>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/componentes/checkout/Address.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/componentes/checkout/Address.svelte";

    // (37:2) {#if !filled || update}
    function create_if_block$1(ctx) {
    	let div;
    	let addressform;
    	let div_outro;
    	let current;

    	addressform = new AddressForm({
    			props: {
    				type: /*type*/ ctx[1],
    				address: /*address*/ ctx[3]
    			},
    			$$inline: true
    		});

    	addressform.$on("filled", /*handleFilledForm*/ ctx[4]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(addressform.$$.fragment);
    			attr_dev(div, "class", "col-2 svelte-ifagkg");
    			add_location(div, file$1, 37, 4, 843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(addressform, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const addressform_changes = {};
    			if (dirty & /*type*/ 2) addressform_changes.type = /*type*/ ctx[1];
    			if (dirty & /*address*/ 8) addressform_changes.address = /*address*/ ctx[3];
    			addressform.$set(addressform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addressform.$$.fragment, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addressform.$$.fragment, local);

    			if (local) {
    				div_outro = create_out_transition(div, fly, { x: -30, duration: 250 });
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(addressform);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(37:2) {#if !filled || update}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let addresspreview;
    	let div0_class_value;
    	let current;
    	let if_block = (!/*filled*/ ctx[0] || /*update*/ ctx[2]) && create_if_block$1(ctx);

    	addresspreview = new AddressPreview({
    			props: {
    				filled: /*filled*/ ctx[0],
    				address: /*address*/ ctx[3],
    				update: /*update*/ ctx[2]
    			},
    			$$inline: true
    		});

    	addresspreview.$on("update", /*handleAddressUpdate*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			create_component(addresspreview.$$.fragment);
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*filled*/ ctx[0] ? "col-1" : "col-2") + " svelte-ifagkg"));
    			add_location(div0, file$1, 41, 2, 994);
    			attr_dev(div1, "class", "container svelte-ifagkg");
    			add_location(div1, file$1, 35, 0, 789);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			mount_component(addresspreview, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*filled*/ ctx[0] || /*update*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*filled, update*/ 5) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const addresspreview_changes = {};
    			if (dirty & /*filled*/ 1) addresspreview_changes.filled = /*filled*/ ctx[0];
    			if (dirty & /*address*/ 8) addresspreview_changes.address = /*address*/ ctx[3];
    			if (dirty & /*update*/ 4) addresspreview_changes.update = /*update*/ ctx[2];
    			addresspreview.$set(addresspreview_changes);

    			if (!current || dirty & /*filled*/ 1 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*filled*/ ctx[0] ? "col-1" : "col-2") + " svelte-ifagkg"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(addresspreview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(addresspreview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_component(addresspreview);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Address", slots, []);
    	let { filled } = $$props;
    	let { type } = $$props;
    	let update = false;

    	let address = {
    		firstName: "",
    		lastName: "",
    		city: "",
    		postcode: "",
    		streetFirstLine: "",
    		streetSecondLine: ""
    	};

    	const dispatch = createEventDispatcher();

    	function handleFilledForm() {
    		dispatch("filled", { type: type.toLowerCase() });
    		$$invalidate(2, update = false);
    	}

    	AddressStore.subscribe(store => {
    		$$invalidate(3, address = store[type.toLowerCase()]);
    	});

    	function handleAddressUpdate() {
    		$$invalidate(2, update = !update);
    	}

    	const writable_props = ["filled", "type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Address> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		AddressForm,
    		AddressPreview,
    		createEventDispatcher,
    		AddressStore,
    		filled,
    		type,
    		update,
    		address,
    		dispatch,
    		handleFilledForm,
    		handleAddressUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("update" in $$props) $$invalidate(2, update = $$props.update);
    		if ("address" in $$props) $$invalidate(3, address = $$props.address);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filled, type, update, address, handleFilledForm, handleAddressUpdate];
    }

    class Address extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { filled: 0, type: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Address",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*filled*/ ctx[0] === undefined && !("filled" in props)) {
    			console.warn("<Address> was created without expected prop 'filled'");
    		}

    		if (/*type*/ ctx[1] === undefined && !("type" in props)) {
    			console.warn("<Address> was created without expected prop 'type'");
    		}
    	}

    	get filled() {
    		throw new Error("<Address>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filled(value) {
    		throw new Error("<Address>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Address>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Address>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Checkout.svelte generated by Svelte v3.37.0 */
    const file = "src/pages/Checkout.svelte";

    // (30:0) {#if filled.shipping && filled.billing}
    function create_if_block(ctx) {
    	let h3;
    	let t1;
    	let deliverymethods;
    	let current;
    	deliverymethods = new DeliveryMethods({ $$inline: true });

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Delivery Method:";
    			t1 = space();
    			create_component(deliverymethods.$$.fragment);
    			attr_dev(h3, "class", "svelte-fbdh4k");
    			add_location(h3, file, 30, 4, 762);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(deliverymethods, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(deliverymethods.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(deliverymethods.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			destroy_component(deliverymethods, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:0) {#if filled.shipping && filled.billing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h30;
    	let t1;
    	let address0;
    	let t2;
    	let h31;
    	let t4;
    	let address1;
    	let t5;
    	let if_block_anchor;
    	let current;

    	address0 = new Address({
    			props: {
    				type: "Shipping",
    				filled: /*filled*/ ctx[0].shipping
    			},
    			$$inline: true
    		});

    	address0.$on("filled", /*handleFilledForm*/ ctx[1]);

    	address1 = new Address({
    			props: {
    				type: "Billing",
    				filled: /*filled*/ ctx[0].billing
    			},
    			$$inline: true
    		});

    	address1.$on("filled", /*handleFilledForm*/ ctx[1]);
    	let if_block = /*filled*/ ctx[0].shipping && /*filled*/ ctx[0].billing && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Shipping Address:";
    			t1 = space();
    			create_component(address0.$$.fragment);
    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Billing Address:";
    			t4 = space();
    			create_component(address1.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(h30, "class", "svelte-fbdh4k");
    			add_location(h30, file, 24, 0, 504);
    			attr_dev(h31, "class", "svelte-fbdh4k");
    			add_location(h31, file, 26, 0, 612);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(address0, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(address1, target, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const address0_changes = {};
    			if (dirty & /*filled*/ 1) address0_changes.filled = /*filled*/ ctx[0].shipping;
    			address0.$set(address0_changes);
    			const address1_changes = {};
    			if (dirty & /*filled*/ 1) address1_changes.filled = /*filled*/ ctx[0].billing;
    			address1.$set(address1_changes);

    			if (/*filled*/ ctx[0].shipping && /*filled*/ ctx[0].billing) {
    				if (if_block) {
    					if (dirty & /*filled*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(address0.$$.fragment, local);
    			transition_in(address1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(address0.$$.fragment, local);
    			transition_out(address1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t1);
    			destroy_component(address0, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t4);
    			destroy_component(address1, detaching);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Checkout", slots, []);
    	let filled = { shipping: false, billing: false };

    	BasketStore.subscribe(store => {
    		if (!store) {
    			push("/");
    		}
    	});

    	function handleFilledForm(e) {
    		$$invalidate(0, filled[e.detail.type] = true, filled);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkout> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		BasketStore,
    		push,
    		fly,
    		DeliveryMethods,
    		Address,
    		filled,
    		handleFilledForm
    	});

    	$$self.$inject_state = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [filled, handleFilledForm];
    }

    class Checkout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Checkout",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */

    // (11:0) <Layout>
    function create_default_slot(ctx) {
    	let router0;
    	let t0;
    	let router1;
    	let t1;
    	let router2;
    	let current;

    	router0 = new Router({
    			props: { routes: { "/basket": Basket } },
    			$$inline: true
    		});

    	router1 = new Router({
    			props: { routes: { "/summary": Checkout } },
    			$$inline: true
    		});

    	router2 = new Router({
    			props: { routes: { "/": Home } },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router0.$$.fragment);
    			t0 = space();
    			create_component(router1.$$.fragment);
    			t1 = space();
    			create_component(router2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(router0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(router1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(router2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router0.$$.fragment, local);
    			transition_in(router1.$$.fragment, local);
    			transition_in(router2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router0.$$.fragment, local);
    			transition_out(router1.$$.fragment, local);
    			transition_out(router2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(router1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(router2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(11:0) <Layout>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Layout, Router, Basket, Home, Checkout });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
