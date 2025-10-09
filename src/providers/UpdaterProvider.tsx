import React, { createContext, useContext, useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { info, error as logError, warn } from "@tauri-apps/plugin-log";
import { showNotification } from "../utils/notifications";
import { Button, Group, Modal, Progress, Stack, Text } from "@mantine/core";
import { getVersion } from "@tauri-apps/api/app";

interface UpdaterContextType {
  checkForUpdates: () => Promise<void>;
  updateAvailable: Update | null;
  isChecking: boolean;
  showUpdateModal: () => void;
}

const UpdaterContext = createContext<UpdaterContextType | undefined>(undefined);

export const useUpdater = () => {
  const context = useContext(UpdaterContext);
  if (!context) {
    throw new Error("useUpdater must be used within UpdaterProvider");
  }
  return context;
};

interface UpdaterProviderProps {
  children?: React.ReactNode;
}

export const UpdaterProvider: React.FC<UpdaterProviderProps> = ({ children }) => {
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Check if updater is disabled via environment variable
  const isUpdaterDisabled = import.meta.env.VITE_DISABLE_UPDATER === "true";

  useEffect(() => {
    if (isUpdaterDisabled) {
      info("[Updater] Auto-updater is disabled via VITE_DISABLE_UPDATER environment variable");
      return;
    }
    // Check for updates on app startup
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    if (isUpdaterDisabled) {
      info("[Updater] Update check skipped - updater is disabled");
      return;
    }

    try {
      setIsChecking(true);
      const currentVersion = await getVersion();
      info(`[Updater] Starting update check. Current version: ${currentVersion}`);
      info(`[Updater] Checking update endpoint configured in tauri.conf.json`);

      const update = await check();

      if (update) {
        info(`[Updater] Update available!`);
        info(`[Updater] - New version: ${update.version}`);
        info(`[Updater] - Current version: ${update.currentVersion}`);
        info(`[Updater] - Release date: ${update.date}`);
        info(`[Updater] - Release notes: ${update.body}`);

        setUpdateAvailable(update);
        setIsModalOpen(true);
      } else {
        info(`[Updater] No update available. App is up to date.`);

        // Only show notification if manually triggered (not on startup)
        if (isChecking) {
          showNotification({
            title: "No Updates",
            message: "You're running the latest version.",
            type: "success",
            autoCloseInMs: 3000,
          });
        }
      }
    } catch (error) {
      logError(`[Updater] Error checking for updates: ${error}`);
      console.error("[Updater] Error checking for updates:", error);

      // Log detailed error information
      if (error instanceof Error) {
        logError(`[Updater] Error name: ${error.name}`);
        logError(`[Updater] Error message: ${error.message}`);
        logError(`[Updater] Error stack: ${error.stack}`);
      }

      // Don't show error notification to user - fail silently for better UX
      warn(`[Updater] Update check failed, but continuing app startup`);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstallUpdate = async () => {
    if (!updateAvailable) {
      warn(`[Updater] No update available to install`);
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      info(`[Updater] Starting download of version ${updateAvailable.version}`);

      let downloaded = 0;
      let contentLength = 0;

      await updateAvailable.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            info(`[Updater] Download started. Content length: ${contentLength} bytes`);
            console.log(`[Updater] Download started. Size: ${contentLength} bytes`);
            break;

          case "Progress":
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setDownloadProgress(progress);
            info(
              `[Updater] Download progress: ${downloaded}/${contentLength} bytes (${progress.toFixed(1)}%)`,
            );
            console.log(
              `[Updater] Download progress: ${downloaded}/${contentLength} bytes (${progress.toFixed(1)}%)`,
            );
            break;

          case "Finished":
            info(`[Updater] Download finished. Total downloaded: ${downloaded} bytes`);
            console.log(`[Updater] Download finished`);
            break;
        }
      });

      info(`[Updater] Update installed successfully`);
      info(`[Updater] Preparing to relaunch application...`);
      console.log(`[Updater] Update installed, relaunching app...`);

      showNotification({
        title: "Update Installed",
        message: "The application will now restart to complete the update.",
        type: "success",
        autoCloseInMs: 3000,
      });

      // Give user a moment to see the notification
      setTimeout(async () => {
        info(`[Updater] Relaunching application now`);
        await relaunch();
      }, 2000);
    } catch (error) {
      logError(`[Updater] Error downloading/installing update: ${error}`);
      console.error("[Updater] Error downloading/installing update:", error);

      if (error instanceof Error) {
        logError(`[Updater] Error name: ${error.name}`);
        logError(`[Updater] Error message: ${error.message}`);
        logError(`[Updater] Error stack: ${error.stack}`);
      }

      setIsDownloading(false);
      setDownloadProgress(0);

      showNotification({
        title: "Update Failed",
        message: "Failed to download or install the update. Please try again later.",
        type: "error",
        autoCloseInMs: 5000,
      });
    }
  };

  const handleInstallLater = () => {
    info(`[Updater] User chose to install update later`);
    setIsModalOpen(false);
  };

  const handleInstallNow = () => {
    info(`[Updater] User chose to install update now`);
    downloadAndInstallUpdate();
  };

  const showUpdateModalManually = () => {
    if (updateAvailable) {
      setIsModalOpen(true);
    }
  };

  const contextValue: UpdaterContextType = {
    checkForUpdates,
    updateAvailable,
    isChecking,
    showUpdateModal: showUpdateModalManually,
  };

  return (
    <UpdaterContext.Provider value={contextValue}>
      {children}

      <Modal
        opened={isModalOpen}
        onClose={handleInstallLater}
        title="Update Available"
        centered
        closeOnClickOutside={!isDownloading}
        closeOnEscape={!isDownloading}
        withCloseButton={!isDownloading}
      >
        <Stack gap="md">
          {updateAvailable && (
            <>
              <Text size="sm">
                A new version <strong>{updateAvailable.version}</strong> is available.
              </Text>

              {updateAvailable.body && (
                <div>
                  <Text size="sm" fw={600} mb="xs">
                    Release Notes:
                  </Text>
                  <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
                    {updateAvailable.body}
                  </Text>
                </div>
              )}

              {isDownloading && (
                <div>
                  <Text size="sm" mb="xs">
                    Downloading update... {downloadProgress.toFixed(1)}%
                  </Text>
                  <Progress value={downloadProgress} animated />
                </div>
              )}

              <Group justify="flex-end" gap="sm">
                <Button variant="subtle" onClick={handleInstallLater} disabled={isDownloading}>
                  Install Later
                </Button>
                <Button onClick={handleInstallNow} loading={isDownloading}>
                  Install Now
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </UpdaterContext.Provider>
  );
};
