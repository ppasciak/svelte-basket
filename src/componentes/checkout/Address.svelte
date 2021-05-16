<script>
  import { fly } from "svelte/transition";
  import AddressForm from "./AddressForm.svelte";
  import AddressPreview from "./AddressPreview.svelte";
  import { createEventDispatcher } from "svelte";
  import { AddressStore } from "../../stores/addressStore";

  export let filled;
  export let type;

  let duplicatedAddress = false;
  let update = false;
  let address = {
    firstName: "",
    lastName: "",
    city: "",
    postcode: "",
    streetFirstLine: "",
    streetSecondLine: "",
  };

  const dispatch = createEventDispatcher();

  function handleFilledForm() {
    dispatch("filled", { type: type.toLowerCase() });
    update = false;
  }

  function handleDuplicateAddress () {
    if(duplicatedAddress) {
      AddressStore.update((store) => {
        let oldStore = store;
        let shippingAddress = store['shipping'];
        oldStore['billing'] = {...shippingAddress};

        return oldStore;
      })
    }
  }

  AddressStore.subscribe((store) => {
    address = store[type.toLowerCase()];
    JSON.stringify(address) !== JSON.stringify(store['shipping']) ? duplicatedAddress = false : null;
  });

  function handleAddressUpdate() {
    update = !update;
    duplicatedAddress = false
  }
</script>

<div class="container">
  {#if !filled || update}
    <div class="col-2" out:fly|local={{ x: -30, duration: 250 }}>
      {#if type === 'Billing'}
        <div class="checkbox-wrapper">
          <input type="checkbox" id="same-as-shipping" bind:checked={duplicatedAddress} on:change={handleDuplicateAddress} />
          <label for="same-as-shipping">Billing address same as shipping</label>
        </div>
      {/if}
      <AddressForm {type} {address} on:filled={handleFilledForm} />
    </div>
  {/if}
  <div class={filled ? "col-1" : "col-2"}>
    <AddressPreview
      {filled}
      {address}
      {update}
      on:update={handleAddressUpdate}
    />
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    padding: 0;

    @media only screen and (min-width: $srceen-m) {
        flex-direction: row;
    }

    .col-1,
    .col-2 {
      width: 100%;
    }

    .col-2 {
      padding: 0 10px;
    }
  }
</style>
