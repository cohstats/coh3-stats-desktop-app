import { EventEmitter } from "@tauri-apps/api/shell"
import { useEffect, useRef, useState } from "react"
import { Store } from "tauri-plugin-store-api"
import { getStore } from "./store"

const CONFIG_CHANGE_EVENT = new EventEmitter()

export const configValueFactory = <T,>(
  key: string,
  defaultValueFunc: () => Promise<T>,
  validatorFunc?: (value: T, store: Store, defaultValue: T) => Promise<T>
) => {
  const reactHook = () => {
    const [value, setValue] = useState<T>()
    const valueInitializedRef = useRef(false)

    useEffect(() => {
      const init = async () => {
        const store = await getStore()
        const storeValue = await store.get<T>(key)
        const defaultValue = await defaultValueFunc()
        let validatedValue = defaultValue
        if (validatorFunc !== undefined) {
          if (storeValue === null) {
            validatedValue = await validatorFunc(
              defaultValue,
              store,
              defaultValue
            )
          } else {
            validatedValue = await validatorFunc(
              storeValue,
              store,
              defaultValue
            )
          }
        } else if (storeValue !== null) {
          validatedValue = storeValue
        }
        await store.set(key, validatedValue)
        await store.save()
        CONFIG_CHANGE_EVENT.emit(key, validatedValue)
        valueInitializedRef.current = true
      }
      if (valueInitializedRef.current === false) {
        init()
      }
      const onChange = (value: T) => {
        setValue(value)
      }
      CONFIG_CHANGE_EVENT.on(key, onChange)
      return () => {
        CONFIG_CHANGE_EVENT.off(key, onChange)
      }
    }, [])

    const setValueExtern = async (value: T) => {
      const store = await getStore()
      let validatedValue = value
      if (validatorFunc) {
        const defaultValue = await defaultValueFunc()
        validatedValue = await validatorFunc(value, store, defaultValue)
      }
      await store.set(key, validatedValue)
      await store.save()
      CONFIG_CHANGE_EVENT.emit(key, validatedValue)
    }

    return [value, setValueExtern] as const
  }
  const getter: () => Promise<T> = async () => {
    const store = await getStore()
    const storeValue = await store.get<T>(key)
    if (storeValue === null) {
      return await defaultValueFunc()
    }
    return storeValue
  }
  return [getter, reactHook] as const
}

/*export const useConfigValue = <T,>(
    key: string,
    defaultValueFunc: () => Promise<T>,
    validator?: (value: T, store: Store, defaultValue: T) => Promise<T>
) => {
    const [value, setValue] = useState<T>()
    const valueInitializedRef = useRef(false)

    useEffect(() => {
        const init = async () => {
            const store = await getStore()
            const storeValue = await store.get<T>(key)
            const defaultValue = await defaultValueFunc()
            let validatedValue = defaultValue
            if (validator) {
                if (storeValue === null) {
                    validatedValue = await validator(
                        defaultValue,
                        store,
                        defaultValue
                    )
                } else {
                    validatedValue = await validator(
                        storeValue,
                        store,
                        defaultValue
                    )
                }
            }
            await store.set(key, validatedValue)
            await store.save()
            CONFIG_CHANGE_EVENT.emit(key, validatedValue)
            valueInitializedRef.current = true
        }
        if (valueInitializedRef.current === false) {
            init()
        }
        const onChange = (value: T) => {
            setValue(value)
        }
        CONFIG_CHANGE_EVENT.on(key, onChange)
        return () => {
            CONFIG_CHANGE_EVENT.off(key, onChange)
        }
    }, [])

    const setValueExtern = async (value: T) => {
        const store = await getStore()
        let validatedValue = value
        if (validator) {
            const defaultValue = await defaultValueFunc()
            validatedValue = await validator(value, store, defaultValue)
        }
        await store.set(key, validatedValue)
        await store.save()
        CONFIG_CHANGE_EVENT.emit(key, validatedValue)
    }

    return [value, setValueExtern]
}*/

/*
export const getConfigValue = async <T,>(
    key: string,
    defaultValueFunc: () => Promise<T>
) => {
    const store = await getStore()
    const storeValue = await store.get<T>(key)
    if (storeValue === null) {
        return await defaultValueFunc()
    }
    return storeValue
}*/
