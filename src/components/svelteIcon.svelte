<script>
	export let icon;
	export let onClick;
</script>

<button
	class="pointer-events-auto h-10 w-10 cursor-pointer rounded-full border-0 bg-black/15 p-2 text-white opacity-90 backdrop-blur-sm transition-all duration-200 contain-content hover:bg-primaryLight hover:text-primary"
	title="Close"
	aria-label="Close"
	on:click={() => onClick()}>{@html icon}</button
>
