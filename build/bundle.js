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
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
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

    /* src/componentes/ThemeSwitcher.svelte generated by Svelte v3.37.0 */

    function create_fragment$h(ctx) {
    	let input;
    	let t;
    	let label;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input = element("input");
    			t = space();
    			label = element("label");
    			attr(input, "type", "checkbox");
    			attr(input, "id", "theme-switcher");
    			attr(input, "class", "svelte-rbi9rx");
    			attr(label, "for", "theme-switcher");
    			attr(label, "class", "svelte-rbi9rx");
    		},
    		m(target, anchor) {
    			insert(target, input, anchor);
    			input.checked = /*darkTheme*/ ctx[0];
    			insert(target, t, anchor);
    			insert(target, label, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(input, "change", /*input_change_handler*/ ctx[2]),
    					listen(input, "change", /*setTheme*/ ctx[1])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*darkTheme*/ 1) {
    				input.checked = /*darkTheme*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(input);
    			if (detaching) detach(t);
    			if (detaching) detach(label);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const darkModeMediaString = "(prefers-color-scheme: dark)";

    function instance$d($$self, $$props, $$invalidate) {
    	const preferableDarkMode = window.matchMedia(darkModeMediaString).matches;
    	const choosenTheme = localStorage.getItem("theme");
    	let darkTheme;

    	if (choosenTheme) {
    		document.body.setAttribute("data-theme", choosenTheme);

    		choosenTheme == "dark"
    		? darkTheme = true
    		: darkTheme = false;
    	} else if (preferableDarkMode) {
    		document.body.setAttribute("data-theme", "dark");

    		preferableDarkMode == true
    		? darkTheme = true
    		: darkTheme = false;

    		setTheme();
    	}

    	function setTheme() {
    		let theme = darkTheme ? "dark" : "light";
    		document.body.setAttribute("data-theme", theme);
    		localStorage.setItem("theme", theme);
    	}

    	function input_change_handler() {
    		darkTheme = this.checked;
    		$$invalidate(0, darkTheme);
    	}

    	return [darkTheme, setTheme, input_change_handler];
    }

    class ThemeSwitcher extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$d, create_fragment$h, safe_not_equal, {});
    	}
    }

    /* src/Header.svelte generated by Svelte v3.37.0 */

    function create_fragment$g(ctx) {
    	let header;
    	let div;
    	let themeswitcher;
    	let current;
    	themeswitcher = new ThemeSwitcher({});

    	return {
    		c() {
    			header = element("header");
    			div = element("div");
    			create_component(themeswitcher.$$.fragment);
    			attr(div, "class", "container svelte-1td3o2z");
    			attr(header, "class", "header svelte-1td3o2z");
    		},
    		m(target, anchor) {
    			insert(target, header, anchor);
    			append(header, div);
    			mount_component(themeswitcher, div, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(themeswitcher.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(themeswitcher.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(header);
    			destroy_component(themeswitcher);
    		}
    	};
    }

    class Header extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$g, safe_not_equal, {});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.37.0 */

    function create_fragment$f(ctx) {
    	let footer;

    	return {
    		c() {
    			footer = element("footer");
    			footer.innerHTML = `2021 <a href="https://github.com/ppasciak" target="_blank">Paweł Paściak</a>`;
    			attr(footer, "class", "svelte-13qh0a");
    		},
    		m(target, anchor) {
    			insert(target, footer, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(footer);
    		}
    	};
    }

    class Footer extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$f, safe_not_equal, {});
    	}
    }

    /* src/Layout.svelte generated by Svelte v3.37.0 */

    function create_fragment$e(ctx) {
    	let main;
    	let header;
    	let t0;
    	let div;
    	let t1;
    	let footer;
    	let current;
    	header = new Header({});
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);
    	footer = new Footer({});

    	return {
    		c() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t0 = space();
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			attr(div, "class", "container");
    			attr(main, "class", "app");
    		},
    		m(target, anchor) {
    			insert(target, main, anchor);
    			mount_component(header, main, null);
    			append(main, t0);
    			append(main, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append(main, t1);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(default_slot, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(default_slot, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(main);
    			destroy_component(header);
    			if (default_slot) default_slot.d(detaching);
    			destroy_component(footer);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Layout extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$c, create_fragment$e, safe_not_equal, {});
    	}
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

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
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
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
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

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
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
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
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

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
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

    derived(loc, $loc => $loc.location);
    derived(loc, $loc => $loc.querystring);

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

    function instance$b($$self, $$props, $$invalidate) {
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

    class Router extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$b, create_fragment$d, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});
    	}
    }

    /* src/componentes/basket/QuantitySelector.svelte generated by Svelte v3.37.0 */

    function create_fragment$c(ctx) {
    	let button0;
    	let t1;
    	let span;
    	let t2;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button0 = element("button");
    			button0.textContent = "-";
    			t1 = space();
    			span = element("span");
    			t2 = text(/*quantity*/ ctx[0]);
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			attr(button0, "class", "square svelte-1ytkkta");
    			attr(span, "class", "product-quanity__value svelte-1ytkkta");
    			attr(button1, "class", "square svelte-1ytkkta");
    		},
    		m(target, anchor) {
    			insert(target, button0, anchor);
    			insert(target, t1, anchor);
    			insert(target, span, anchor);
    			append(span, t2);
    			insert(target, t3, anchor);
    			insert(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*handleDecrease*/ ctx[1]),
    					listen(button1, "click", /*handleIncrease*/ ctx[2])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*quantity*/ 1) set_data(t2, /*quantity*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(button0);
    			if (detaching) detach(t1);
    			if (detaching) detach(span);
    			if (detaching) detach(t3);
    			if (detaching) detach(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
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

    	$$self.$$set = $$props => {
    		if ("quantity" in $$props) $$invalidate(0, quantity = $$props.quantity);
    		if ("id" in $$props) $$invalidate(3, id = $$props.id);
    	};

    	return [quantity, handleDecrease, handleIncrease, id];
    }

    class QuantitySelector extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$c, safe_not_equal, { quantity: 0, id: 3 });
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
    			}
    		});

    	quantityselector.$on("quantityChange", /*handleQuantityChange*/ ctx[6]);

    	return {
    		c() {
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
    			if (img.src !== (img_src_value = `assets/products/${/*image*/ ctx[3]}`)) attr(img, "src", img_src_value);
    			attr(img, "alt", /*name*/ ctx[0]);
    			attr(img, "class", "svelte-191393z");
    			attr(div0, "class", "product__image svelte-191393z");
    			attr(div1, "class", "product__name svelte-191393z");
    			attr(div2, "class", "product__qty svelte-191393z");
    			attr(span0, "class", "prodcut__price__currency svelte-191393z");
    			attr(span1, "class", "svelte-191393z");
    			attr(span2, "class", "product__price--tax-inc svelte-191393z");
    			attr(div3, "class", "product__price svelte-191393z");
    			attr(button, "class", "square remove svelte-191393z");
    			attr(div4, "class", "product__action svelte-191393z");
    			attr(li, "class", "product svelte-191393z");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, div0);
    			append(div0, img);
    			append(li, t0);
    			append(li, div1);
    			append(div1, t1);
    			append(li, t2);
    			append(li, div2);
    			mount_component(quantityselector, div2, null);
    			append(li, t3);
    			append(li, div3);
    			append(div3, span1);
    			append(span1, t4);
    			append(span1, t5);
    			append(span1, span0);
    			append(div3, t7);
    			append(div3, span2);
    			append(span2, t8);
    			append(span2, t9);
    			append(li, t10);
    			append(li, div4);
    			append(div4, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen(button, "click", /*handleProductRemove*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (!current || dirty & /*image*/ 8 && img.src !== (img_src_value = `assets/products/${/*image*/ ctx[3]}`)) {
    				attr(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*name*/ 1) {
    				attr(img, "alt", /*name*/ ctx[0]);
    			}

    			if (!current || dirty & /*name*/ 1) set_data(t1, /*name*/ ctx[0]);
    			const quantityselector_changes = {};
    			if (dirty & /*quantity*/ 2) quantityselector_changes.quantity = /*quantity*/ ctx[1];
    			if (dirty & /*id*/ 16) quantityselector_changes.id = /*id*/ ctx[4];
    			quantityselector.$set(quantityselector_changes);
    			if (!current || dirty & /*price*/ 4) set_data(t4, /*price*/ ctx[2]);
    			if ((!current || dirty & /*price, taxRate*/ 36) && t8_value !== (t8_value = (/*price*/ ctx[2] * (1 + /*taxRate*/ ctx[5])).toFixed(2) + "")) set_data(t8, t8_value);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(quantityselector.$$.fragment, local);
    			if (li_outro) li_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			transition_out(quantityselector.$$.fragment, local);

    			if (local) {
    				li_outro = create_out_transition(li, fly, { x: 30, duration: 250 });
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			destroy_component(quantityselector);
    			if (detaching && li_outro) li_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
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

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("quantity" in $$props) $$invalidate(1, quantity = $$props.quantity);
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    		if ("image" in $$props) $$invalidate(3, image = $$props.image);
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("taxRate" in $$props) $$invalidate(5, taxRate = $$props.taxRate);
    	};

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

    class ProductItem extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$9, create_fragment$b, safe_not_equal, {
    			name: 0,
    			quantity: 1,
    			price: 2,
    			image: 3,
    			id: 4,
    			taxRate: 5
    		});
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

    	return {
    		c() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "red");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*promise*/ 2 && t_value !== (t_value = /*error*/ ctx[7].message + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (1:0) <script>     import ProductItem from './ProductItem.svelte';     import { BasketStore }
    function create_then_block(ctx) {
    	return { c: noop, m: noop, p: noop, d: noop };
    }

    // (24:16)      <p>waiting...</p> {:catch error}
    function create_pending_block(ctx) {
    	let p;

    	return {
    		c() {
    			p = element("p");
    			p.textContent = "waiting...";
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (36:0) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let t1;
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			p = element("p");
    			p.textContent = "Your cart is empty";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Generate cart";
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			insert(target, t1, anchor);
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", /*handleGetCart*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(p);
    			if (detaching) detach(t1);
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (30:0) {#if products && products.length}
    function create_if_block$6(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*products*/ ctx[0];
    	const get_key = ctx => /*prodcut*/ ctx[4].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(ul, "class", "product-list svelte-1piv6w1");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*products*/ 1) {
    				each_value = /*products*/ ctx[0];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};
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

    	productitem = new ProductItem({ props: productitem_props });

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(productitem.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(productitem, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			const productitem_changes = (dirty & /*products*/ 1)
    			? get_spread_update(productitem_spread_levels, [get_spread_object(/*prodcut*/ ctx[4])])
    			: {};

    			productitem.$set(productitem_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(productitem.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(productitem.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(productitem, detaching);
    		}
    	};
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

    	return {
    		c() {
    			info.block.c();
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t.parentNode;
    			info.anchor = t;
    			insert(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(new_ctx, [dirty]) {
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
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
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

    	return [products, promise, handleGetCart];
    }

    class ProductList extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$a, safe_not_equal, {});
    	}
    }

    /* src/componentes/basket/Totals.svelte generated by Svelte v3.37.0 */

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

    	return {
    		c() {
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
    			attr(h4, "class", "svelte-189u4v8");
    			attr(span0, "class", "svelte-189u4v8");
    			attr(div0, "class", "totals__qty svelte-189u4v8");
    			attr(span1, "class", "svelte-189u4v8");
    			attr(div1, "class", "totals__tax-exl svelte-189u4v8");
    			attr(span2, "class", "svelte-189u4v8");
    			attr(div2, "class", "totals__tax-inc svelte-189u4v8");
    			attr(div3, "class", "totals-grid svelte-189u4v8");
    			attr(div4, "class", "totals svelte-189u4v8");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, h4);
    			append(div4, t1);
    			append(div4, div3);
    			append(div3, div0);
    			append(div0, t2);
    			append(div0, span0);
    			append(span0, t3);
    			append(div3, t4);
    			append(div3, div1);
    			append(div1, t5);
    			append(div1, span1);
    			append(span1, t6);
    			append(span1, t7);
    			append(div3, t8);
    			append(div3, div2);
    			append(div2, t9);
    			append(div2, span2);
    			append(span2, t10);
    			append(span2, t11);
    			append(div3, t12);
    			if (if_block) if_block.m(div3, null);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*totals*/ 4 && t3_value !== (t3_value = /*totals*/ ctx[2].qty + "")) set_data(t3, t3_value);
    			if (dirty & /*totals*/ 4 && t6_value !== (t6_value = /*totals*/ ctx[2].price.toFixed(2) + "")) set_data(t6, t6_value);
    			if (dirty & /*totals*/ 4 && t10_value !== (t10_value = /*totals*/ ctx[2].taxPrice.toFixed(2) + "")) set_data(t10, t10_value);

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
    		d(detaching) {
    			if (detaching) detach(div4);
    			if (if_block) if_block.d();
    		}
    	};
    }

    // (43:12) {#if deliveryCost >= 0}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1_value = /*deliveryCost*/ ctx[0].toFixed(2) + "";
    	let t1;
    	let t2;

    	return {
    		c() {
    			div = element("div");
    			t0 = text("Delivery: ");
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text(" USD");
    			attr(span, "class", "svelte-189u4v8");
    			attr(div, "class", "totals__delivery svelte-189u4v8");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, span);
    			append(span, t1);
    			append(span, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*deliveryCost*/ 1 && t1_value !== (t1_value = /*deliveryCost*/ ctx[0].toFixed(2) + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*products*/ ctx[1] && /*products*/ ctx[1].length && create_if_block$5(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
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
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let totals;
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

    	$$self.$$set = $$props => {
    		if ("deliveryCost" in $$props) $$invalidate(0, deliveryCost = $$props.deliveryCost);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*products, deliveryCost*/ 3) {
    			$$invalidate(2, totals = calculateTotals(products));
    		}
    	};

    	return [deliveryCost, products, totals];
    }

    class Totals extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$9, safe_not_equal, { deliveryCost: 0 });
    	}
    }

    /* src/componentes/basket/BasketSubmit.svelte generated by Svelte v3.37.0 */

    function create_if_block$4(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<button class="svelte-966t1y">Continue</button>`;
    			attr(div, "class", "basket-actions svelte-966t1y");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (!mounted) {
    				dispose = listen(div, "click", prevent_default(/*handleSubmit*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let if_block = /*products*/ ctx[0] && /*products*/ ctx[0].length && create_if_block$4(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
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
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let products;
    	BasketStore.subscribe(store => $$invalidate(0, products = store));

    	function handleSubmit() {
    		push("/summary");
    	}

    	return [products, handleSubmit];
    }

    class BasketSubmit extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$8, safe_not_equal, {});
    	}
    }

    /* src/pages/Basket.svelte generated by Svelte v3.37.0 */

    function create_fragment$7(ctx) {
    	let h3;
    	let t1;
    	let productlist;
    	let t2;
    	let totals;
    	let t3;
    	let basketsubmit;
    	let current;
    	productlist = new ProductList({});
    	totals = new Totals({});
    	basketsubmit = new BasketSubmit({});

    	return {
    		c() {
    			h3 = element("h3");
    			h3.textContent = "Your cart:";
    			t1 = space();
    			create_component(productlist.$$.fragment);
    			t2 = space();
    			create_component(totals.$$.fragment);
    			t3 = space();
    			create_component(basketsubmit.$$.fragment);
    			attr(h3, "class", "highlighted");
    		},
    		m(target, anchor) {
    			insert(target, h3, anchor);
    			insert(target, t1, anchor);
    			mount_component(productlist, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(totals, target, anchor);
    			insert(target, t3, anchor);
    			mount_component(basketsubmit, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(productlist.$$.fragment, local);
    			transition_in(totals.$$.fragment, local);
    			transition_in(basketsubmit.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(productlist.$$.fragment, local);
    			transition_out(totals.$$.fragment, local);
    			transition_out(basketsubmit.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h3);
    			if (detaching) detach(t1);
    			destroy_component(productlist, detaching);
    			if (detaching) detach(t2);
    			destroy_component(totals, detaching);
    			if (detaching) detach(t3);
    			destroy_component(basketsubmit, detaching);
    		}
    	};
    }

    class Basket extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$7, safe_not_equal, {});
    	}
    }

    /* src/pages/Home.svelte generated by Svelte v3.37.0 */

    function create_fragment$6(ctx) {
    	let h4;

    	return {
    		c() {
    			h4 = element("h4");
    			h4.textContent = "Nothing here...";
    		},
    		m(target, anchor) {
    			insert(target, h4, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(h4);
    		}
    	};
    }

    function instance$5($$self) {
    	push("/basket");
    	return [];
    }

    class Home extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});
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

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (28:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	return {
    		c() {
    			p = element("p");
    			p.textContent = "...";
    			attr(p, "class", "svelte-4v7l0w");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (14:0) {#if deliveryMethods?.length}
    function create_if_block$3(ctx) {
    	let form;
    	let each_value = /*deliveryMethods*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			form = element("form");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(form, "class", "delivery-form svelte-4v7l0w");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(form, null);
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*deliveryMethods, selected*/ 3) {
    				each_value = /*deliveryMethods*/ ctx[0];
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
    		d(detaching) {
    			if (detaching) detach(form);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (21:20) {#if method.price == 0}
    function create_if_block_1$1(ctx) {
    	let span;

    	return {
    		c() {
    			span = element("span");
    			span.textContent = "FREE";
    			attr(span, "class", "delivery-label svelte-4v7l0w");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
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
    	let if_block = /*method*/ ctx[4].price == 0 && create_if_block_1$1();

    	return {
    		c() {
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
    			attr(input, "type", "radio");
    			attr(input, "id", input_id_value = `delivery-${/*method*/ ctx[4].id}`);
    			attr(input, "name", "deliveryMethod");
    			input.__value = input_value_value = /*method*/ ctx[4].price;
    			input.value = input.__value;
    			attr(input, "class", "svelte-4v7l0w");
    			/*$$binding_groups*/ ctx[3][0].push(input);
    			attr(span, "class", "delivery-method__price svelte-4v7l0w");
    			attr(label, "for", label_for_value = `delivery-${/*method*/ ctx[4].id}`);
    			attr(label, "class", "radio-label svelte-4v7l0w");
    			attr(div, "class", "delivery-method svelte-4v7l0w");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, input);
    			input.checked = input.__value === /*selected*/ ctx[1];
    			append(div, t0);
    			append(div, label);
    			append(label, t1);
    			append(label, t2);
    			append(label, span);
    			append(span, t3);
    			append(label, t4);
    			if (if_block) if_block.m(label, null);
    			append(div, t5);

    			if (!mounted) {
    				dispose = listen(input, "change", /*input_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*deliveryMethods*/ 1 && input_id_value !== (input_id_value = `delivery-${/*method*/ ctx[4].id}`)) {
    				attr(input, "id", input_id_value);
    			}

    			if (dirty & /*deliveryMethods*/ 1 && input_value_value !== (input_value_value = /*method*/ ctx[4].price)) {
    				input.__value = input_value_value;
    				input.value = input.__value;
    			}

    			if (dirty & /*selected*/ 2) {
    				input.checked = input.__value === /*selected*/ ctx[1];
    			}

    			if (dirty & /*deliveryMethods*/ 1 && t1_value !== (t1_value = /*method*/ ctx[4].name + "")) set_data(t1, t1_value);
    			if (dirty & /*deliveryMethods*/ 1 && t3_value !== (t3_value = `${/*method*/ ctx[4].price.toFixed(2)} USD` + "")) set_data(t3, t3_value);

    			if (/*method*/ ctx[4].price == 0) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$1();
    					if_block.c();
    					if_block.m(label, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*deliveryMethods*/ 1 && label_for_value !== (label_for_value = `delivery-${/*method*/ ctx[4].id}`)) {
    				attr(label, "for", label_for_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			/*$$binding_groups*/ ctx[3][0].splice(/*$$binding_groups*/ ctx[3][0].indexOf(input), 1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
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
    			props: { deliveryCost: /*selected*/ ctx[1] }
    		});

    	return {
    		c() {
    			if_block.c();
    			t = space();
    			create_component(totals.$$.fragment);
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, t, anchor);
    			mount_component(totals, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
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
    		i(local) {
    			if (current) return;
    			transition_in(totals.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(totals.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(t);
    			destroy_component(totals, detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let deliveryMethods;
    	let selected;

    	onMount(async () => {
    		$$invalidate(0, deliveryMethods = await fetchDeliveryMethods());
    	});

    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		selected = this.__value;
    		$$invalidate(1, selected);
    	}

    	return [deliveryMethods, selected, input_change_handler, $$binding_groups];
    }

    class DeliveryMethods extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {});
    	}
    }

    const AddressStore = writable({
        shipping: {},
        billing: {}
    });

    /* src/componentes/checkout/AddressForm.svelte generated by Svelte v3.37.0 */

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

    	return {
    		c() {
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
    			attr(label0, "for", label0_for_value = `${/*type*/ ctx[1]}-firstName`);
    			attr(label0, "class", "svelte-1k1rrua");
    			attr(input0, "type", "text");
    			attr(input0, "id", input0_id_value = `${/*type*/ ctx[1]}-firstName`);
    			input0.required = true;
    			attr(input0, "class", "svelte-1k1rrua");
    			attr(label1, "for", label1_for_value = `${/*type*/ ctx[1]}-lastName`);
    			attr(label1, "class", "svelte-1k1rrua");
    			attr(input1, "type", "text");
    			attr(input1, "id", input1_id_value = `${/*type*/ ctx[1]}-lastName`);
    			input1.required = true;
    			attr(input1, "class", "svelte-1k1rrua");
    			attr(label2, "for", label2_for_value = `${/*type*/ ctx[1]}-city`);
    			attr(label2, "class", "svelte-1k1rrua");
    			attr(input2, "type", "text");
    			attr(input2, "id", input2_id_value = `${/*type*/ ctx[1]}-city`);
    			input2.required = true;
    			attr(input2, "class", "svelte-1k1rrua");
    			attr(label3, "for", label3_for_value = `${/*type*/ ctx[1]}-postcode`);
    			attr(label3, "class", "svelte-1k1rrua");
    			attr(input3, "type", "text");
    			attr(input3, "id", input3_id_value = `${/*type*/ ctx[1]}-postcode`);
    			input3.required = true;
    			attr(input3, "class", "svelte-1k1rrua");
    			attr(label4, "for", label4_for_value = `${/*type*/ ctx[1]}-streetFirstLine`);
    			attr(label4, "class", "svelte-1k1rrua");
    			attr(input4, "type", "text");
    			attr(input4, "id", input4_id_value = `${/*type*/ ctx[1]}-streetFirstLine`);
    			input4.required = true;
    			attr(input4, "class", "svelte-1k1rrua");
    			attr(label5, "for", label5_for_value = `${/*type*/ ctx[1]}-streetSecondLine`);
    			attr(label5, "class", "svelte-1k1rrua");
    			attr(input5, "type", "text");
    			attr(input5, "id", input5_id_value = `${/*type*/ ctx[1]}-streetSecondLine`);
    			attr(input5, "class", "svelte-1k1rrua");
    			attr(input6, "type", "submit");
    			input6.value = "Confirm";
    			input6.disabled = /*buttonDisabled*/ ctx[2];
    			attr(input6, "class", "svelte-1k1rrua");
    			attr(form, "id", form_id_value = `${/*type*/ ctx[1]}-form`);
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			append(form, label0);
    			append(label0, t0);
    			append(form, t1);
    			append(form, input0);
    			set_input_value(input0, /*address*/ ctx[0].firstName);
    			append(form, t2);
    			append(form, label1);
    			append(label1, t3);
    			append(form, t4);
    			append(form, input1);
    			set_input_value(input1, /*address*/ ctx[0].lastName);
    			append(form, t5);
    			append(form, label2);
    			append(label2, t6);
    			append(form, t7);
    			append(form, input2);
    			set_input_value(input2, /*address*/ ctx[0].city);
    			append(form, t8);
    			append(form, label3);
    			append(label3, t9);
    			append(form, t10);
    			append(form, input3);
    			set_input_value(input3, /*address*/ ctx[0].postcode);
    			append(form, t11);
    			append(form, label4);
    			append(label4, t12);
    			append(form, t13);
    			append(form, input4);
    			set_input_value(input4, /*address*/ ctx[0].streetFirstLine);
    			append(form, t14);
    			append(form, label5);
    			append(label5, t15);
    			append(form, t16);
    			append(form, input5);
    			set_input_value(input5, /*address*/ ctx[0].streetSecondLine);
    			append(form, t17);
    			append(form, input6);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen(input4, "input", /*input4_input_handler*/ ctx[9]),
    					listen(input5, "input", /*input5_input_handler*/ ctx[10]),
    					listen(form, "input", /*handleFormValueChanged*/ ctx[3]),
    					listen(form, "submit", prevent_default(/*handleFormSubmited*/ ctx[4]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*type*/ 2 && label0_for_value !== (label0_for_value = `${/*type*/ ctx[1]}-firstName`)) {
    				attr(label0, "for", label0_for_value);
    			}

    			if (dirty & /*type*/ 2 && input0_id_value !== (input0_id_value = `${/*type*/ ctx[1]}-firstName`)) {
    				attr(input0, "id", input0_id_value);
    			}

    			if (dirty & /*address*/ 1 && input0.value !== /*address*/ ctx[0].firstName) {
    				set_input_value(input0, /*address*/ ctx[0].firstName);
    			}

    			if (dirty & /*type*/ 2 && label1_for_value !== (label1_for_value = `${/*type*/ ctx[1]}-lastName`)) {
    				attr(label1, "for", label1_for_value);
    			}

    			if (dirty & /*type*/ 2 && input1_id_value !== (input1_id_value = `${/*type*/ ctx[1]}-lastName`)) {
    				attr(input1, "id", input1_id_value);
    			}

    			if (dirty & /*address*/ 1 && input1.value !== /*address*/ ctx[0].lastName) {
    				set_input_value(input1, /*address*/ ctx[0].lastName);
    			}

    			if (dirty & /*type*/ 2 && label2_for_value !== (label2_for_value = `${/*type*/ ctx[1]}-city`)) {
    				attr(label2, "for", label2_for_value);
    			}

    			if (dirty & /*type*/ 2 && input2_id_value !== (input2_id_value = `${/*type*/ ctx[1]}-city`)) {
    				attr(input2, "id", input2_id_value);
    			}

    			if (dirty & /*address*/ 1 && input2.value !== /*address*/ ctx[0].city) {
    				set_input_value(input2, /*address*/ ctx[0].city);
    			}

    			if (dirty & /*type*/ 2 && label3_for_value !== (label3_for_value = `${/*type*/ ctx[1]}-postcode`)) {
    				attr(label3, "for", label3_for_value);
    			}

    			if (dirty & /*type*/ 2 && input3_id_value !== (input3_id_value = `${/*type*/ ctx[1]}-postcode`)) {
    				attr(input3, "id", input3_id_value);
    			}

    			if (dirty & /*address*/ 1 && input3.value !== /*address*/ ctx[0].postcode) {
    				set_input_value(input3, /*address*/ ctx[0].postcode);
    			}

    			if (dirty & /*type*/ 2 && label4_for_value !== (label4_for_value = `${/*type*/ ctx[1]}-streetFirstLine`)) {
    				attr(label4, "for", label4_for_value);
    			}

    			if (dirty & /*type*/ 2 && input4_id_value !== (input4_id_value = `${/*type*/ ctx[1]}-streetFirstLine`)) {
    				attr(input4, "id", input4_id_value);
    			}

    			if (dirty & /*address*/ 1 && input4.value !== /*address*/ ctx[0].streetFirstLine) {
    				set_input_value(input4, /*address*/ ctx[0].streetFirstLine);
    			}

    			if (dirty & /*type*/ 2 && label5_for_value !== (label5_for_value = `${/*type*/ ctx[1]}-streetSecondLine`)) {
    				attr(label5, "for", label5_for_value);
    			}

    			if (dirty & /*type*/ 2 && input5_id_value !== (input5_id_value = `${/*type*/ ctx[1]}-streetSecondLine`)) {
    				attr(input5, "id", input5_id_value);
    			}

    			if (dirty & /*address*/ 1 && input5.value !== /*address*/ ctx[0].streetSecondLine) {
    				set_input_value(input5, /*address*/ ctx[0].streetSecondLine);
    			}

    			if (dirty & /*buttonDisabled*/ 4) {
    				input6.disabled = /*buttonDisabled*/ ctx[2];
    			}

    			if (dirty & /*type*/ 2 && form_id_value !== (form_id_value = `${/*type*/ ctx[1]}-form`)) {
    				attr(form, "id", form_id_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
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

    class AddressForm extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, { address: 0, type: 1 });
    	}
    }

    /* src/componentes/checkout/AddressPreview.svelte generated by Svelte v3.37.0 */

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

    	return {
    		c() {
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
    			attr(div, "class", "address-preview");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, strong);
    			append(strong, t0);
    			append(strong, t1);
    			append(strong, t2);
    			append(strong, t3);
    			append(div, br);
    			append(div, t4);
    			append(div, p0);
    			append(p0, t5);
    			append(p0, t6);
    			append(p0, t7);
    			append(div, t8);
    			append(div, p1);
    			append(p1, t9);
    			append(div, t10);
    			append(div, p2);
    			append(p2, t11);
    			append(div, t12);
    			if (if_block) if_block.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*address*/ 4 && t0_value !== (t0_value = (/*address*/ ctx[2].firstName || "") + "")) set_data(t0, t0_value);
    			if (dirty & /*address*/ 4 && t2_value !== (t2_value = (/*address*/ ctx[2].lastName || "") + "")) set_data(t2, t2_value);
    			if (dirty & /*address*/ 4 && t5_value !== (t5_value = (/*address*/ ctx[2].city || "") + "")) set_data(t5, t5_value);
    			if (dirty & /*address*/ 4 && t7_value !== (t7_value = (/*address*/ ctx[2].postcode || "") + "")) set_data(t7, t7_value);
    			if (dirty & /*address*/ 4 && t9_value !== (t9_value = (/*address*/ ctx[2].streetFirstLine || "") + "")) set_data(t9, t9_value);
    			if (dirty & /*address*/ 4 && t11_value !== (t11_value = (/*address*/ ctx[2].streetSecondLine || "") + "")) set_data(t11, t11_value);

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
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    		}
    	};
    }

    // (24:8) {#if filled && !update}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			button.textContent = "edit";
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", /*handleEditAddress*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let if_block = /*address*/ ctx[2] && create_if_block$2(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
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
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { filled } = $$props;
    	let { update } = $$props;
    	let { address } = $$props;
    	const dispatch = createEventDispatcher();

    	function handleEditAddress() {
    		dispatch("update", { update });
    	}

    	$$self.$$set = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    		if ("update" in $$props) $$invalidate(1, update = $$props.update);
    		if ("address" in $$props) $$invalidate(2, address = $$props.address);
    	};

    	return [filled, update, address, handleEditAddress];
    }

    class AddressPreview extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, { filled: 0, update: 1, address: 2 });
    	}
    }

    /* src/componentes/checkout/Address.svelte generated by Svelte v3.37.0 */

    function create_if_block$1(ctx) {
    	let div;
    	let addressform;
    	let div_outro;
    	let current;

    	addressform = new AddressForm({
    			props: {
    				type: /*type*/ ctx[1],
    				address: /*address*/ ctx[3]
    			}
    		});

    	addressform.$on("filled", /*handleFilledForm*/ ctx[4]);

    	return {
    		c() {
    			div = element("div");
    			create_component(addressform.$$.fragment);
    			attr(div, "class", "col-2 svelte-1pcpbmh");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(addressform, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const addressform_changes = {};
    			if (dirty & /*type*/ 2) addressform_changes.type = /*type*/ ctx[1];
    			if (dirty & /*address*/ 8) addressform_changes.address = /*address*/ ctx[3];
    			addressform.$set(addressform_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(addressform.$$.fragment, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			transition_out(addressform.$$.fragment, local);

    			if (local) {
    				div_outro = create_out_transition(div, fly, { x: -30, duration: 250 });
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(addressform);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};
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
    			}
    		});

    	addresspreview.$on("update", /*handleAddressUpdate*/ ctx[5]);

    	return {
    		c() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			create_component(addresspreview.$$.fragment);
    			attr(div0, "class", div0_class_value = "" + (null_to_empty(/*filled*/ ctx[0] ? "col-1" : "col-2") + " svelte-1pcpbmh"));
    			attr(div1, "class", "container svelte-1pcpbmh");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append(div1, t);
    			append(div1, div0);
    			mount_component(addresspreview, div0, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
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

    			if (!current || dirty & /*filled*/ 1 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*filled*/ ctx[0] ? "col-1" : "col-2") + " svelte-1pcpbmh"))) {
    				attr(div0, "class", div0_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(addresspreview.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			transition_out(addresspreview.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (if_block) if_block.d();
    			destroy_component(addresspreview);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
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

    	$$self.$$set = $$props => {
    		if ("filled" in $$props) $$invalidate(0, filled = $$props.filled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    	};

    	return [filled, type, update, address, handleFilledForm, handleAddressUpdate];
    }

    class Address extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, { filled: 0, type: 1 });
    	}
    }

    /* src/pages/Checkout.svelte generated by Svelte v3.37.0 */

    function create_if_block(ctx) {
    	let h3;
    	let t1;
    	let deliverymethods;
    	let current;
    	deliverymethods = new DeliveryMethods({});

    	return {
    		c() {
    			h3 = element("h3");
    			h3.textContent = "Delivery Method:";
    			t1 = space();
    			create_component(deliverymethods.$$.fragment);
    			attr(h3, "class", "svelte-fbdh4k");
    		},
    		m(target, anchor) {
    			insert(target, h3, anchor);
    			insert(target, t1, anchor);
    			mount_component(deliverymethods, target, anchor);
    			current = true;
    		},
    		i(local) {
    			if (current) return;
    			transition_in(deliverymethods.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(deliverymethods.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h3);
    			if (detaching) detach(t1);
    			destroy_component(deliverymethods, detaching);
    		}
    	};
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
    			}
    		});

    	address0.$on("filled", /*handleFilledForm*/ ctx[1]);

    	address1 = new Address({
    			props: {
    				type: "Billing",
    				filled: /*filled*/ ctx[0].billing
    			}
    		});

    	address1.$on("filled", /*handleFilledForm*/ ctx[1]);
    	let if_block = /*filled*/ ctx[0].shipping && /*filled*/ ctx[0].billing && create_if_block();

    	return {
    		c() {
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
    			attr(h30, "class", "svelte-fbdh4k");
    			attr(h31, "class", "svelte-fbdh4k");
    		},
    		m(target, anchor) {
    			insert(target, h30, anchor);
    			insert(target, t1, anchor);
    			mount_component(address0, target, anchor);
    			insert(target, t2, anchor);
    			insert(target, h31, anchor);
    			insert(target, t4, anchor);
    			mount_component(address1, target, anchor);
    			insert(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
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
    					if_block = create_if_block();
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
    		i(local) {
    			if (current) return;
    			transition_in(address0.$$.fragment, local);
    			transition_in(address1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(address0.$$.fragment, local);
    			transition_out(address1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(h30);
    			if (detaching) detach(t1);
    			destroy_component(address0, detaching);
    			if (detaching) detach(t2);
    			if (detaching) detach(h31);
    			if (detaching) detach(t4);
    			destroy_component(address1, detaching);
    			if (detaching) detach(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let filled = { shipping: false, billing: false };

    	BasketStore.subscribe(store => {
    		if (!store) {
    			push("/");
    		}
    	});

    	function handleFilledForm(e) {
    		$$invalidate(0, filled[e.detail.type] = true, filled);
    	}

    	return [filled, handleFilledForm];
    }

    class Checkout extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */

    function create_default_slot(ctx) {
    	let router0;
    	let t0;
    	let router1;
    	let t1;
    	let router2;
    	let current;
    	router0 = new Router({ props: { routes: { "/basket": Basket } } });

    	router1 = new Router({
    			props: { routes: { "/summary": Checkout } }
    		});

    	router2 = new Router({ props: { routes: { "/": Home } } });

    	return {
    		c() {
    			create_component(router0.$$.fragment);
    			t0 = space();
    			create_component(router1.$$.fragment);
    			t1 = space();
    			create_component(router2.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(router0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(router1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(router2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(router0.$$.fragment, local);
    			transition_in(router1.$$.fragment, local);
    			transition_in(router2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(router0.$$.fragment, local);
    			transition_out(router1.$$.fragment, local);
    			transition_out(router2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(router0, detaching);
    			if (detaching) detach(t0);
    			destroy_component(router1, detaching);
    			if (detaching) detach(t1);
    			destroy_component(router2, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let layout;
    	let current;

    	layout = new Layout({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(layout.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(layout, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const layout_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_changes.$$scope = { dirty, ctx };
    			}

    			layout.$set(layout_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(layout.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(layout.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(layout, detaching);
    		}
    	};
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
