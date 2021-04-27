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
    .app {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .container {
        max-width: 680px;
        margin: 0 auto;
        width: 100%;
    }
</style>