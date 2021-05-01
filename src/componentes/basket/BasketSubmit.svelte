<script>
    import {BasketStore} from '../../stores/basketStore'
    
    let products;
    BasketStore.subscribe(store =>  products = store);
    
    function handleSubmit() {
        console.log(products)
    }
</script>

{#if products && products.length}
    <div class="basket-actions" on:click|preventDefault={handleSubmit}>
        <button>
            Continue
        </button>
    </div>
{/if}

<style lang="scss">
    .basket-actions {
        display: flex;
        justify-content: flex-end;
        padding: 10px 0;
    }

    button {
        padding: 10px;
        width: 100%;
        max-width: 320px;

        &:hover:after {
            left: 5px;
            bottom: -5px;
        }
    }
</style>