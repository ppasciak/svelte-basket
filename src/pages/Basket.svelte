<script>
    import ProductList from '../componentes/basket/ProductList.svelte';
    import Totals from '../componentes/basket/Totals.svelte';
</script>

<h3 class="highlighted">Your cart:</h3>
<ProductList />
<Totals />
<div class="basket-actions">
    <button>
        Continue
    </button>
</div>


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