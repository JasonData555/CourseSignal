import { updateAllLaunchStatuses } from '../services/launches/launchService';

/**
 * Background job to automatically update launch statuses
 * Runs every 5 minutes to transition launches between upcoming/active/completed
 */
export async function startLaunchStatusUpdater() {
  console.log('🚀 Launch status updater started');

  // Run immediately on startup
  await runStatusUpdate();

  // Then run every 5 minutes
  setInterval(async () => {
    await runStatusUpdate();
  }, 5 * 60 * 1000); // 5 minutes
}

async function runStatusUpdate() {
  try {
    const result = await updateAllLaunchStatuses();

    if (result.activated > 0 || result.completed > 0) {
      console.log(
        `✅ Launch statuses updated: ${result.activated} activated, ${result.completed} completed`
      );
    }
  } catch (error) {
    console.error('❌ Error updating launch statuses:', error);
  }
}
