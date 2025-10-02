// Navigation helper that can be used outside of Router context
// This is a workaround for calling navigation from providers that are outside the Router

let navigateFunction: ((path: string) => void) | null = null;
let getCurrentPath: (() => string) | null = null;

export const setNavigationHelpers = (navigate: (path: string) => void, getPath: () => string) => {
  navigateFunction = navigate;
  getCurrentPath = getPath;
};

export const navigateTo = (path: string) => {
  if (navigateFunction) {
    navigateFunction(path);
  } else {
    console.warn("Navigation function not initialized yet");
  }
};

export const getCurrentRoute = (): string | null => {
  if (getCurrentPath) {
    return getCurrentPath();
  }
  return null;
};
