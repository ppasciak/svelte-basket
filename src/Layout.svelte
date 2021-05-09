<script>
    import Header from './Header.svelte';
    import Footer from './Footer.svelte';
</script>

<main class="app">
    <Header />
    <div class="container">
        <slot></slot>
    </div>
    <Footer />
</main>

<style>

</style>