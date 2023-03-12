import { Outlet } from "react-router-dom"
import { WindowTitleBar } from "./WindowTitleBar"
import {useEffect} from "react";
import events from "./utils/mixpanel";

export const Root: React.FC = () => {

    useEffect(() => {
        events.init().then()
    }, [])

    return (
        <>
            <WindowTitleBar>
                <Outlet />
            </WindowTitleBar>
        </>
    )
}
