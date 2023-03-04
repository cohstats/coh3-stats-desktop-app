import React, { useContext, useEffect, useState } from "react"
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater"
import { relaunch } from "@tauri-apps/api/process"

export type UpdateStatus = "upToDate" | "updating" | "checking" | "error"

export interface UpdaterData {
    status: UpdateStatus
}

const updaterContext = React.createContext<UpdaterData>({ status: "checking" })
export const useUpdaterData = () => useContext(updaterContext)

export interface UpdaterProviderProps {
    children?: React.ReactNode
}

export const UpdaterProvider: React.FC<UpdaterProviderProps> = ({
    children,
}) => {
    const [appStatus, setAppStatus] = useState<UpdateStatus>("checking")
    useEffect(() => {
        const checkForUpdate = async () => {
            try {
                const { shouldUpdate, manifest } = await checkUpdate()
                if (shouldUpdate) {
                    setAppStatus("updating")
                } else {
                    setAppStatus("upToDate")
                }
            } catch (error) {
                console.log(error)
                setAppStatus("error")
            }
        }
        const update = async () => {
            try {
                await installUpdate()
                // restart after install complete
                await relaunch()
            } catch (error) {
                console.log(error)
                setAppStatus("error")
            }
        }
        if (appStatus === "checking") {
            checkForUpdate()
        }
        if (appStatus === "updating") {
            update()
        }
    }, [appStatus])
    return (
        <>
            <updaterContext.Provider value={{ status: appStatus }}>
                {children}
            </updaterContext.Provider>
        </>
    )
}
