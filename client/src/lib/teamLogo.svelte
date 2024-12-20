<script lang="ts">
  import MirranWatermark from '$lib/assets/mirran.svg?raw';
  import PhyrexianWatermark from '$lib/assets/phyrexian.svg?raw';
  import type { Team } from '../../../shared/types';

  const { team }: { team: Team } = $props();
</script>

<span>
  {@html team === 'mirran' ? MirranWatermark : PhyrexianWatermark}
</span>
