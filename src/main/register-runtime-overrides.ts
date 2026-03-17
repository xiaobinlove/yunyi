import { registerPathHandler } from "./ipc/path-handler";
import { registerRecipesHandler } from "./ipc/recipes-handler";
import { registerScreenshotHandler } from "./ipc/screenshot-handler";
import { registerSessionHandler } from "./ipc/session-handler";
import { registerShellHandler } from "./ipc/shell-handler";
import { registerUpdaterHandler } from "./ipc/updater-handler";
import { registerAppExitHandler } from "./lifecycle/app-exit-handler";
import { RecipeService } from "./services/recipe-service";
import { ScreenshotService } from "./services/screenshot-service";
import { SessionService } from "./services/session-service";
import { ShellService } from "./services/shell-service";
import { UpdaterService } from "./services/updater-service";
import { WebContentsDebugService } from "./services/web-contents-debug-service";
import { registerWindowHandlers } from "./window/window-handler";
import type { RuntimeOverridesContext } from "./types";

export function registerRuntimeOverrides({ app, paths, windowRegistry }: RuntimeOverridesContext): void {
  const recipeService = new RecipeService(app, paths);
  const screenshotService = new ScreenshotService(paths);
  const sessionService = new SessionService(app, paths);
  const shellService = new ShellService(windowRegistry);
  const updaterService = new UpdaterService(windowRegistry);
  const webContentsDebugService = new WebContentsDebugService(app);

  registerPathHandler(paths);
  registerRecipesHandler(recipeService);
  registerScreenshotHandler(screenshotService);
  registerShellHandler(shellService);
  registerSessionHandler(sessionService);
  registerWindowHandlers(windowRegistry);
  registerUpdaterHandler(updaterService);
  registerAppExitHandler(app, windowRegistry);
  webContentsDebugService.install();
}
