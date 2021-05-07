<script>
	import { BasketStore } from "../stores/basketStore";
	import { push } from "svelte-spa-router";
	import { fly } from "svelte/transition";
	import DeliveryMethods from "../componentes/checkout/DeliveryMethods.svelte";
	import Address from "../componentes/checkout/Address.svelte";

	let filled = {
		shipping: false,
		billing: false,
	};

	BasketStore.subscribe((store) => {
		if (!store) {
			push("/");
		}
	});

	function handleFilledForm(e) {
		console.log(e.detail.type)
		filled[e.detail.type] = true;
	}

</script>

<h3>Shipping Address:</h3>
<Address type="Shipping" on:filled={handleFilledForm} filled={filled.shipping}/>
<h3>Billing Address:</h3>
<Address type="Billing" on:filled={handleFilledForm} filled={filled.billing}/>

{#if filled.shipping && filled.billing}
    <h3>Delivery Method:</h3>
    <DeliveryMethods />
{/if}

<style lang="scss">
    .container {
        display: flex;
        flex-direction: row;

        .col-1,
        .col-2 {
        width: 100%;
        }
    }
</style>
