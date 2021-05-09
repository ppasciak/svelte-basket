<script>
    import ThemeSwitcher from './componentes/ThemeSwitcher.svelte'
</script>

<header class="header">
    <div class="container">
        <ThemeSwitcher />
    </div>
</header>


<style lang="scss">
    .header {
        height: 50px;
        background: $secondary;
    }
    
    .container {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
    }
</style>