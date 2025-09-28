import { useEffect, useRef, useState } from "react";
import { load } from "@tauri-apps/plugin-store";
import { getStore } from "./store";

type Store = Awaited<ReturnType<typeof load>>;

// Simple EventEmitter implementation for config changes
class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((listener) => listener(...args));
  }
}

const CONFIG_CHANGE_EVENT = new SimpleEventEmitter();

export const configValueFactory = <T,>(
  key: string,
  defaultValueFunc: () => Promise<T>,
  validatorFunc?: (value: T, store: Store, defaultValue: T) => Promise<T>,
) => {
  const reactHook = () => {
    const [value, setValue] = useState<T>();
    const valueInitializedRef = useRef(false);

    useEffect(() => {
      const init = async () => {
        const store = await getStore();
        const storeValue = await store.get<T>(key);
        const defaultValue = await defaultValueFunc();
        let validatedValue = defaultValue;
        if (validatorFunc !== undefined) {
          if (storeValue === null || storeValue === undefined) {
            validatedValue = await validatorFunc(defaultValue, store, defaultValue);
          } else {
            validatedValue = await validatorFunc(storeValue as T, store, defaultValue);
          }
        } else if (storeValue !== null && storeValue !== undefined) {
          validatedValue = storeValue as Awaited<T>;
        }
        await store.set(key, validatedValue);
        await store.save();
        CONFIG_CHANGE_EVENT.emit(key, validatedValue);
        valueInitializedRef.current = true;
      };
      if (valueInitializedRef.current === false) {
        init();
      }
      const onChange = (value: T) => {
        setValue(value);
      };
      CONFIG_CHANGE_EVENT.on(key, onChange);
      return () => {
        CONFIG_CHANGE_EVENT.off(key, onChange);
      };
    }, []);

    const setValueExtern = async (value: T) => {
      const store = await getStore();
      let validatedValue = value;
      if (validatorFunc) {
        const defaultValue = await defaultValueFunc();
        validatedValue = await validatorFunc(value, store, defaultValue);
      }
      await store.set(key, validatedValue);
      await store.save();
      CONFIG_CHANGE_EVENT.emit(key, validatedValue);
    };

    return [value, setValueExtern] as const;
  };
  const getter: () => Promise<T> = async () => {
    const store = await getStore();
    const storeValue = await store.get<T>(key);
    if (storeValue === null || storeValue === undefined) {
      return await defaultValueFunc();
    }
    return storeValue as T;
  };
  return [getter, reactHook] as const;
};

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
