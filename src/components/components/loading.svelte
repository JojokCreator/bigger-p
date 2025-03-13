<script>
	import { fly } from "svelte/transition";
	import { closing, getThumbBackground } from "../stores";

	export let activeItem;
	export let loaded;
</script>

{#if !loaded}
	<div
		class="z-[1] flex h-full overflow-hidden bg-[length:100%_100%]"
		out:fly|local={{ duration: 480 }}
		style:background-image={activeItem ? getThumbBackground(activeItem) : ""}
	>
		<span
			class="absolute left-0 top-0 h-[4px] w-full -translate-x-full transform animate-bp-bar rounded-full bg-white/90"
		></span>
		<div class="mx-auto grid place-items-center">
			<div
				class="absolute h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-primaryLight"
			></div>
			<div class="absolute z-[99999] grid h-32 w-32 place-items-center">
				<img
					src="/logo-black.svg"
					class="h-24 w-auto rounded-full opacity-80"
					alt="Logo"
				/>
			</div>
		</div>
	</div>
{/if}

{#if $closing}
	<div
		class="z-[1] flex overflow-hidden bg-[length:100%_100%]"
		in:fly|global={{ duration: 480 }}
		style:background-image={activeItem ? getThumbBackground(activeItem) : ""}
	></div>
{/if}
