<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { AddressStore } from "../../stores/addressStore";

  export let address;
  export let type;
  let buttonDisabled = !checkFormValid();

  const dispatch = createEventDispatcher();

  onMount(() => {
	  buttonDisabled = !checkFormValid();
	});

  function handleFormValueChanged(e) {
    AddressStore.update((store) => {
      let oldStore = store;
      let _type = type.toLowerCase();
      oldStore[_type] = address;

      return oldStore;
    });

    updateSubmitButtonState();
  }

  function updateSubmitButtonState() {
    if (checkFormValid()) {
      buttonDisabled = false;
    } else {
      buttonDisabled = true;
    }
  }

  function checkFormValid() {
    let form = document.getElementById(`${type}-form`);
    if (form) {
      return form.checkValidity()
    }
    return false
  }

  function handleFormSubmited() {
    dispatch("filled", {
      form: type.toLowerCase(),
    });
  }
</script>

<form
  on:input={handleFormValueChanged}
  on:submit|preventDefault={handleFormSubmited}
  id={`${type}-form`}
>
  <label for={`${type}-firstName`}>Firstname: </label>
  <input
    type="text"
    id={`${type}-firstName`}
    bind:value={address.firstName}
    required
  />

  <label for={`${type}-lastName`}>Lastname: </label>
  <input
    type="text"
    id={`${type}-lastName`}
    bind:value={address.lastName}
    required
  />

  <label for={`${type}-city`}>City: </label>
  <input type="text" id={`${type}-city`} bind:value={address.city} required />

  <label for={`${type}-postcode`}>Postcode: </label>
  <input
    type="text"
    id={`${type}-postcode`}
    bind:value={address.postcode}
    required
  />

  <label for={`${type}-streetFirstLine`}>Street address: </label>
  <input
    type="text"
    id={`${type}-streetFirstLine`}
    bind:value={address.streetFirstLine}
    required
  />

  <label for={`${type}-streetSecondLine`}>Street address: </label>
  <input
    type="text"
    id={`${type}-streetSecondLine`}
    bind:value={address.streetSecondLine}
  />
  <input type="submit" value="Confirm" disabled={buttonDisabled} />
</form>

<style>
  input {
    display: block;
    border-radius: 0;
    padding: 10px;
    margin: 5px 0 15px 0;
    width: 100%;
    max-width: 320px;
    border: 1px solid black;
  }

  label {
    display: block;
  }
</style>
