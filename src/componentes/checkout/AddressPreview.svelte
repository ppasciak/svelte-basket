<script>
    import { createEventDispatcher } from "svelte";
    export let filled;
    export let update;
    export let address;

    const dispatch = createEventDispatcher();

    function handleEditAddress() {
        dispatch('update', {
            update
        });
    }
</script>

{#if address}
    <div class="address-preview">
        <strong>
            {address.firstName || ''} {address.lastName || ''}
        </strong><br>
        <p>{address.city || ''} {address.postcode || ''}</p>
        <p>{address.streetFirstLine || ''}</p>
        <p>{address.streetSecondLine|| ''}</p>
        {#if filled && !update}
            <button on:click={handleEditAddress}>edit</button>
        {/if}
    </div>
{/if}
