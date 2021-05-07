<script>
    import {fetchDeliveryMethods} from '../../fetches/fetchDeliveryMethods';
	import { onMount } from 'svelte';
    import Totals from '../basket/Totals.svelte';

    let deliveryMethods;
    let selected;

    onMount(async () => {
		deliveryMethods = await fetchDeliveryMethods();
	});
</script>

{#if deliveryMethods?.length}
    <form class="delivery-form">
        {#each deliveryMethods as method}
            <div class="delivery-method">
                <input type="radio" id={`delivery-${method.id}`} bind:group={selected} name="deliveryMethod" value={method.price}>
                <label for={`delivery-${method.id}`} class="radio-label">
                    {method.name} <span class="delivery-method__price">{`${(method.price).toFixed(2)} USD`}</span>
                    {#if method.price == 0}
                        <span class="delivery-label">FREE</span>
                    {/if}
                </label>
            </div>
        {/each}
    </form>
{:else}
    <p>...</p>
{/if}
<Totals deliveryCost={selected}/>

<style lang="scss">
    .delivery{
        &-label {
            background-color: var(--primary);
            color: white;
            padding: 5px;
        }

        &-method {
            margin: 10px 0;

            &__price {
                color: #aaa;
            }
        }
    }

    input[type=radio] {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;

        &:checked ~ .radio-label:after{
            position: absolute;
            content: '';
            width: 12px;
            height: 12px;
            left: 4px;
            top: 0;
            bottom: 0;
            margin: auto;
            border-radius: 50%;
            background-color: var(--primary);
        }
    }

    .radio-label {
        position: relative;
        padding-left: 40px;
        cursor: pointer;

        &:before {
            position: absolute;
            width: 18px;
            content: '';
            height: 18px;
            border-radius: 50%;
            border: 1px solid var(--primary);
            left: 0;
            top: 0;
            bottom: 0;
            margin: auto;
        }
    }
</style>