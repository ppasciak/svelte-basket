import { writable } from 'svelte/store';

export const AddressStore = writable({
    shipping: {},
    billing: {}
});
