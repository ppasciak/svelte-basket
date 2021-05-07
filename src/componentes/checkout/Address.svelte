<script>
  import { fly } from "svelte/transition";
  import AddressForm from "./AddressForm.svelte";
  import AddressPreview from "./AddressPreview.svelte";
  import { createEventDispatcher } from "svelte";
  import { AddressStore } from "../../stores/addressStore";

  export let filled;
  export let type;
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

  AddressStore.subscribe((store) => {
    address = store[type.toLowerCase()];
  });

  function handleAddressUpdate() {
    update = !update;
  }
</script>

<div class="container">
  {#if !filled || update}
    <div class="col-2" out:fly|local={{ x: -30, duration: 250 }}>
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

    @media only screen and (min-width: $srceen-m) {
        flex-direction: row;
    }

    .col-1,
    .col-2 {
      width: 100%;
    }
  }
</style>
