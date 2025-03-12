<script lang="ts">
    import "../app.scss";

    let {children} = $props();
</script>
<div class="container">
    {@render children()}
</div>