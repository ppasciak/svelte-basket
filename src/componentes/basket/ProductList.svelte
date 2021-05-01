<script>
    import ProductItem from './ProductItem.svelte';
    import { BasketStore } from '../../stores/basketStore'
    import {fetchProducts} from '../../fetches/fetchProducts'

    let products;
    let promise;

    BasketStore.subscribe(store => products = store);


    async function handleGetCart() {
        promise = getProducts();
    }

    async function getProducts() {
        let response = await fetchProducts();
        products = response;
        BasketStore.update(store => store = response);
    }

</script>

{#await promise}
    <p>waiting...</p>
{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

{#if products && products.length}
    <ul class="product-list">
        {#each products as prodcut (prodcut.id)}
            <ProductItem {...prodcut}/>
        {/each}
    </ul>
{:else}
    <p>Your cart is empty</p>
    <button on:click={handleGetCart}>Generate cart</button>
{/if}


<style>
    .product-list {
        list-style-type: none;
        display: flex;
        flex-direction: column;
        padding-left: 0;
    }
</style>