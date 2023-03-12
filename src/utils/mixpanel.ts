import mixpanel from 'mixpanel-browser';
import {getVersion} from "@tauri-apps/api/app";

mixpanel.init("bf92acb0810b9e7d4a49e63efc41433d",  {debug: true})

const clientId = "test";
let version = ""

/**
 * The events for Mixpanel
 * Make sure that init is called before any other event
 */
const events = {
    init: async (): Promise<void> => {

        version = await getVersion()

        mixpanel.track("app_init", {
            distinct_id: clientId,
            version,
        })
    },
    open_about: (): void => {
        mixpanel.track("open_about", {
            distinct_id: clientId,
            version,
        })
    },
    open_settings: (): void => {
        mixpanel.track("open_settings", {
            distinct_id: clientId,
            version,
        })
    },
    settings_changed: (setting: string, value?: string | number): void => {
        mixpanel.track("settings_changed", {
            distinct_id: clientId,
            version,
            setting,
            value
        })
    }
}

export default events;