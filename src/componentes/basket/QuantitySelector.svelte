<script>
    export let quantity = 0;
    export let id;
    
	import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    const handleDecrease = () => {
        if(quantity > 0) {
            quantity -= 1;
        };
        dispatch('quantityChange', {id, quantity})
    }

    const handleIncrease = () => {
        quantity += 1;
        dispatch('quantityChange', {id, quantity})
    }
</script>


<button on:click={handleDecrease} class="square">-</button>
<span class="product-quanity__value">{quantity}</span>
<button on:click={handleIncrease} class="square">+</button>

<style lang="scss">
    .product-quanity__value {
        width: 1.5em;
        display: inline-block;
    }
</style>