
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
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
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
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

    function form(...fields) {
        let names = [];
        let doubles = [];
        fields.forEach((field) => {
            const obj = get_store_value(field);
            if (names.includes(obj.name)) {
                doubles = doubles.includes(obj.name) ? doubles : [...doubles, obj.name];
            }
            else {
                names = [...names, obj.name];
            }
        });
        if (doubles.length) {
            throw new Error(`Cannot have the fields with the same name: ${doubles.join(', ')}`);
        }
        const store = derived(fields, (values) => {
            return {
                valid: values.every((value) => value.valid),
                dirty: values.some((value) => value.dirty),
                // Summary as a getter to avoid useless computation of data
                // if no one wants it
                get summary() {
                    return values.reduce((carry, f) => {
                        carry[f.name] = f.value;
                        return carry;
                    }, {});
                },
                errors: values
                    .map((value) => {
                    return value.errors.map((e) => {
                        if (e.includes('.')) {
                            return e;
                        }
                        return `${value.name}.${e}`;
                    });
                })
                    .flat()
                    .filter((value, index, self) => self.indexOf(value) === index),
                hasError(name) {
                    return this.errors.findIndex((e) => e === name) !== -1;
                }
            };
        });
        const { subscribe } = store;
        function reset() {
            fields.forEach((field) => field.reset && field.reset());
        }
        function clear() {
            fields.forEach((field) => field.clear && field.clear());
        }
        async function validate() {
            for (const field of fields) {
                if (field.validate)
                    await field.validate();
            }
        }
        function getField(name) {
            return fields.find((f) => get_store_value(f).name === name);
        }
        function summary() {
            return get_store_value(store).summary;
        }
        return { subscribe, reset, validate, getField, summary, clear };
    }

    function isPromise(obj) {
      return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
    }

    const defaultFieldOptions = {
        valid: true,
        checkOnInit: false,
        validateOnChange: true,
        stopAtFirstError: false
    };
    function isField(field) {
        const keys = Object.keys(field);
        return ['name', 'value', 'valid', 'invalid', 'errors'].every((key) => keys.includes(key));
    }

    function getValue(value) {
        const isStore = function (v) {
            return value.subscribe !== undefined;
        };
        const isField = function (v) {
            return !!value.name && value.valid !== undefined;
        };
        if (isStore()) {
            return get_store_value(value).value;
        }
        else if (isField()) {
            return value.value;
        }
        return value;
    }
    async function getErrors(value, validators, stopAtFirstError = false) {
        const v = getValue(value);
        let errors = [];
        for (const validator of validators) {
            let result = validator(v);
            if (isPromise(result)) {
                result = await result;
            }
            if (stopAtFirstError && !result.valid) {
                errors = [result];
                break;
            }
            errors = [...errors, result];
        }
        return errors;
    }
    function processField(field, validations, partialField = {}) {
        if (validations) {
            const errors = validations.filter((v) => !v.valid).map((v) => v.name);
            const valid = !errors.length;
            return { ...field, valid, invalid: !valid, errors, ...partialField };
            // return { ...field, dirty: field.dirty || !!validations.length, valid, invalid: !valid, errors, ...partialField };
        }
        return field;
    }
    function createFieldStore(name, v, validators = [], options) {
        const value = {
            name,
            value: v,
            valid: options.valid,
            invalid: !options.valid,
            dirty: false,
            errors: []
        };
        const store = writable(value);
        const { subscribe, update, set: _set } = store;
        async function set(field, forceValidation = false) {
            if (!isField(field)) {
                field = processField(get_store_value(store), [], { value: field });
            }
            if (forceValidation || options.validateOnChange) {
                let validations = await getErrors(field, validators, options.stopAtFirstError);
                _set(processField(field, validations, { dirty: true }));
            }
            else {
                _set(processField(field, [], { dirty: true }));
            }
        }
        async function validate() {
            const errors = await getErrors(store, validators, options.stopAtFirstError);
            let obj;
            update((field) => {
                obj = processField(field, errors, { dirty: false });
                return obj;
            });
            return obj;
        }
        function reset() {
            _set(processField({
                dirty: false,
                errors: [],
                name,
                valid: options.valid,
                invalid: !options.valid,
                value: v
            }));
        }
        if (options.checkOnInit) {
            set(value);
        }
        function clear() {
            _set(processField({
                dirty: false,
                errors: [],
                name,
                valid: options.valid,
                invalid: !options.valid,
                value: null
            }));
        }
        return { subscribe, update, set, validate, reset, clear };
    }

    function field(name, value, validators = [], options = {}) {
        return createFieldStore(name, value, validators, { ...defaultFieldOptions, ...options });
    }

    function email() {
        return (value) => {
            const regex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
            return { valid: Boolean(value) && regex.test(value), name: 'not_an_email' };
        };
    }

    function required() {
        return (val) => {
            let valid = true;
            if (val === undefined || val === null)
                valid = false;
            if (typeof val === 'string') {
                const tmp = val.replace(/\s/g, '');
                valid = tmp.length > 0;
            }
            return { valid, name: 'required' };
        };
    }

    function url() {
        const regex = /(https?|ftp|git|svn):\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,63}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
        return (value) => ({ valid: regex.test(value), name: 'url' });
    }

    /* src/App.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (26:1) {#if $myForm.hasError('userEmail.not_an_email')}
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "email!";
    			set_style(div, "background-color", "tomato");
    			add_location(div, file, 25, 49, 1000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(26:1) {#if $myForm.hasError('userEmail.not_an_email')}",
    		ctx
    	});

    	return block;
    }

    // (30:1) {#if $myForm.hasError('something.required')}
    function create_if_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "required!";
    			set_style(div, "background-color", "tomato");
    			add_location(div, file, 29, 45, 1252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(30:1) {#if $myForm.hasError('something.required')}",
    		ctx
    	});

    	return block;
    }

    // (34:1) {#if $myForm.hasError('someurl.url')}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "url!";
    			set_style(div, "background-color", "tomato");
    			add_location(div, file, 33, 38, 1480);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:1) {#if $myForm.hasError('someurl.url')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let section;
    	let t0;
    	let input0;
    	let t1;
    	let show_if_2 = /*$myForm*/ ctx[3].hasError('userEmail.not_an_email');
    	let br0;
    	let t2;
    	let input1;
    	let t3;
    	let show_if_1 = /*$myForm*/ ctx[3].hasError('something.required');
    	let br1;
    	let t4;
    	let input2;
    	let t5;
    	let show_if = /*$myForm*/ ctx[3].hasError('someurl.url');
    	let br2;
    	let mounted;
    	let dispose;
    	let if_block0 = show_if_2 && create_if_block_2(ctx);
    	let if_block1 = show_if_1 && create_if_block_1(ctx);
    	let if_block2 = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			t0 = text("email\n\n\n\t");
    			input0 = element("input");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			br0 = element("br");
    			t2 = text("\n\nrequired\n\t");
    			input1 = element("input");
    			t3 = space();
    			if (if_block1) if_block1.c();
    			br1 = element("br");
    			t4 = text("\n\nurl\n\t");
    			input2 = element("input");
    			t5 = space();
    			if (if_block2) if_block2.c();
    			br2 = element("br");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Type email");
    			attr_dev(input0, "name", "email");
    			add_location(input0, file, 24, 1, 777);
    			add_location(br0, file, 25, 104, 1055);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 28, 1, 1071);
    			add_location(br1, file, 29, 103, 1310);
    			attr_dev(input2, "type", "text");
    			add_location(input2, file, 32, 1, 1321);
    			add_location(br2, file, 33, 91, 1533);
    			add_location(section, file, 16, 0, 460);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, t0);
    			append_dev(section, input0);
    			set_input_value(input0, /*$userEmail*/ ctx[2].value);
    			append_dev(section, t1);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, br0);
    			append_dev(section, t2);
    			append_dev(section, input1);
    			set_input_value(input1, /*$something*/ ctx[1].value);
    			append_dev(section, t3);
    			if (if_block1) if_block1.m(section, null);
    			append_dev(section, br1);
    			append_dev(section, t4);
    			append_dev(section, input2);
    			set_input_value(input2, /*$someurl*/ ctx[0].value);
    			append_dev(section, t5);
    			if (if_block2) if_block2.m(section, null);
    			append_dev(section, br2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input0, "mousedown", /*mousedown_handler*/ ctx[9], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(input1, "mousedown", /*mousedown_handler_1*/ ctx[11], false, false, false),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[12]),
    					listen_dev(input2, "mousedown", /*mousedown_handler_2*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$userEmail*/ 4 && input0.value !== /*$userEmail*/ ctx[2].value) {
    				set_input_value(input0, /*$userEmail*/ ctx[2].value);
    			}

    			if (dirty & /*$myForm*/ 8) show_if_2 = /*$myForm*/ ctx[3].hasError('userEmail.not_an_email');

    			if (show_if_2) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(section, br0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*$something*/ 2 && input1.value !== /*$something*/ ctx[1].value) {
    				set_input_value(input1, /*$something*/ ctx[1].value);
    			}

    			if (dirty & /*$myForm*/ 8) show_if_1 = /*$myForm*/ ctx[3].hasError('something.required');

    			if (show_if_1) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(section, br1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*$someurl*/ 1 && input2.value !== /*$someurl*/ ctx[0].value) {
    				set_input_value(input2, /*$someurl*/ ctx[0].value);
    			}

    			if (dirty & /*$myForm*/ 8) show_if = /*$myForm*/ ctx[3].hasError('someurl.url');

    			if (show_if) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(section, br2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
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
    	let $someurl;
    	let $something;
    	let $userEmail;
    	let $myForm;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const userEmail = field('userEmail', '', [email()]);
    	validate_store(userEmail, 'userEmail');
    	component_subscribe($$self, userEmail, value => $$invalidate(2, $userEmail = value));
    	const something = field('something', '', [required()]);
    	validate_store(something, 'something');
    	component_subscribe($$self, something, value => $$invalidate(1, $something = value));
    	const someurl = field('someurl', '', [url()]);
    	validate_store(someurl, 'someurl');
    	component_subscribe($$self, someurl, value => $$invalidate(0, $someurl = value));
    	const myForm = form(userEmail, something, someurl);
    	validate_store(myForm, 'myForm');
    	component_subscribe($$self, myForm, value => $$invalidate(3, $myForm = value));
    	set_store_value(userEmail, $userEmail.value = 'bogdan@gorelkin.me', $userEmail);
    	set_store_value(something, $something.value = 'text', $something);
    	set_store_value(someurl, $someurl.value = 'https://b.gorelkin.me/', $someurl);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$userEmail.value = this.value;
    		userEmail.set($userEmail);
    	}

    	const mousedown_handler = () => console.log('email:', $myForm.hasError('userEmail.not_an_email'));

    	function input1_input_handler() {
    		$something.value = this.value;
    		something.set($something);
    	}

    	const mousedown_handler_1 = () => console.log('required:', $myForm.hasError('someurl.required'));

    	function input2_input_handler() {
    		$someurl.value = this.value;
    		someurl.set($someurl);
    	}

    	const mousedown_handler_2 = () => console.log('url:', $myForm.hasError('someurl.url'));

    	$$self.$capture_state = () => ({
    		form,
    		field,
    		required,
    		email,
    		url,
    		userEmail,
    		something,
    		someurl,
    		myForm,
    		$someurl,
    		$something,
    		$userEmail,
    		$myForm
    	});

    	return [
    		$someurl,
    		$something,
    		$userEmail,
    		$myForm,
    		userEmail,
    		something,
    		someurl,
    		myForm,
    		input0_input_handler,
    		mousedown_handler,
    		input1_input_handler,
    		mousedown_handler_1,
    		input2_input_handler,
    		mousedown_handler_2
    	];
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
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
