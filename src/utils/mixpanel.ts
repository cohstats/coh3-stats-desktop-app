import mixpanel from 'mixpanel-browser';
import {getVersion} from "@tauri-apps/api/app";

mixpanel.init("bf92acb0810b9e7d4a49e63efc41433d",  {debug: true})

const clientId = "test";

const events = {
    init: async (): Promise<void> => {
        mixpanel.track("app_init", {
            distinct_id: clientId,
            version: await getVersion(),
        })
    },
    open_about: async (): Promise<void> => {
        mixpanel.track("open_about", {
            distinct_id: clientId,
            version: await getVersion(),
        })
    },
    open_settings: async (): Promise<void> => {
        mixpanel.track("open_settings", {
            distinct_id: clientId,
            version: await getVersion(),
        })
    }
}

export default events;