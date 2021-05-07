<script>
    import {BasketStore} from '../../stores/basketStore';
    export let deliveryCost = undefined;
    let products;
    BasketStore.subscribe(data => products = data);

    $: totals = calculateTotals(products, deliveryCost);

    function calculateTotals(products) {
        let tempTotals = {
            qty: 0,
            price: 0,
            taxPrice: 0
        };
        
        if(products) {
            products.forEach(el => {
                tempTotals.qty += el.quantity;
                tempTotals.price += el.price * el.quantity;
                tempTotals.taxPrice += (el.price * el.quantity) * (1 + el.taxRate)
            });
            tempTotals.price += parseFloat(deliveryCost) || 0;
            tempTotals.taxPrice += parseFloat(deliveryCost) || 0;
        }
        
        return tempTotals;
    }
</script>

{#if products && products.length}
    <div class="totals">
        <h4>Summary:</h4>
        <div class="totals-grid">
            <div class="totals__qty">
                Products quantity: <span>{totals.qty}</span>
            </div>
            <div class="totals__tax-exl">
                Taxes excluded: <span>{(totals.price).toFixed(2)} USD</span>
            </div>
            <div class="totals__tax-inc">
                Taxes included: <span>{(totals.taxPrice).toFixed(2)} USD</span>
            </div>
            {#if deliveryCost >= 0}
                <div class="totals__delivery">
                    Delivery: <span>{(deliveryCost).toFixed(2)} USD</span>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style lang="scss">
    .totals {
        padding: 20px;
        border: 1px solid $secondary;
        @media only screen and (min-width: $srceen-m) {
            margin: 20px 0;
        }

        &-grid {
            display: flex;
            flex-direction: column;
            
            @media only screen and (min-width: $srceen-m) {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
            }

            div {
                padding: 10px;
            }

            span {
                display: block;
                font-weight: 700;
            }
        }
    }
</style>