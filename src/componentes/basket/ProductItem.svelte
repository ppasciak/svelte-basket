<script>
  import QuantitySelector from "./QuantitySelector.svelte";
  import { BasketStore } from "../../stores/basketStore";
  import { fly } from "svelte/transition";

  export let name;
  export let quantity;
  export let price;
  export let taxRate;
  export let image;
  export let id;

  function handleQuantityChange(event) {
    let _id = event.detail.id;
    let _quantity = event.detail.quantity;

    BasketStore.update((currentState) => {
      let oldState = [...currentState];
      let productIndex = oldState.findIndex((product) => product.id === _id);
      let modifiedProduct = oldState[productIndex];

      modifiedProduct.quantity = _quantity;

      oldState[productIndex] = modifiedProduct;

      return oldState;
    });
  }

  function handleProductRemove() {
    BasketStore.update((currentState) => {
      return currentState.filter((product) => product.id != id);
    });
  }
</script>

<li class="product" out:fly={{ x: 30, duration: 250 }}>
  <div class="product__image">
    <img src={`../assets/products/${image}`} alt={name} />
  </div>
  <div class="product__name">{name}</div>
  <div class="product__qty">
    <QuantitySelector
      on:quantityChange={handleQuantityChange}
      {quantity}
      {id}
    />
  </div>
  <div class="product__price">
    {price} <span class="prodcut__price__currency">USD</span>
  </div>
  <div class="product__action">
    <button class="square remove" on:click={handleProductRemove}>X</button>
  </div>
</li>

<style lang="scss">
  .product {
    display: grid;
    align-items: center;
    padding: 25px 0;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: 2fr;
    grid-gap: 5px;
    grid-template-areas:
      "image name name"
      "qty price action";

    @media only screen and (min-width: $srceen-m) {
      grid-template-columns: 1fr 3fr repeat(3, 1fr);
      grid-template-rows: 1fr;
      grid-template-areas: "image name qty price action";
      grid-gap: 5px;
    }
    
    &:not(&:last-of-type) {
      border-bottom: 1px solid $secondary;
    }

    &__qty,
    &__price,
    &__action {
      text-align: center;
    }

    &__qty {
      grid-area: qty;
      min-width: 100px;
    }

    &__price {
      grid-area: price;
    }

    &__action {
      grid-area: action;
    }

    &__name {
      font-weight: 600;
      padding: 0 10px;
      grid-area: name;
    }

    &__image {
      grid-area: image;

      img {
        max-width: 100%;
        display: block;
      }
    }
  }

  button.remove {
    background-color: $orange;

    &:hover:after {
      background-color: $orange;
    }
  }
</style>
