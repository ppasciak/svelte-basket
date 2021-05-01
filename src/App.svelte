<script>
	import Layout from './Layout.svelte';
	import Router from 'svelte-spa-router';
	import Basket from './pages/Basket.svelte';
	import Home from './pages/Home.svelte';

</script>
	
<Layout>
	<Router routes={{
		'/basket': Basket
	}} />
	<Router routes={{
		'/': Home
	}} />
</Layout>

<style lang="scss" global>
		@import './scss/main.scss';
</style>