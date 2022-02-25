import {PageCallbackRouter, PageHandlerFactory, PageHandlerRemote} from './federated_internals.mojom-webui.js';

export class FederatedInternalsBrowserProxy {
  handler;
  callbackRouter;

  constructor() {
    this.callbackRouter = new PageCallbackRouter();
    this.handler = new PageHandlerRemote();
    const factory = PageHandlerFactory.getRemote();
    factory.createPageHandler(
        this.callbackRouter.$.bindNewPipeAndPassRemote(),
        this.handler.$.bindNewPipeAndPassReceiver());
  }

  getServiceStatus() {
    return this.handler.getServiceStatus();
  }

  executeModel(target) {
    return this.handler.executeModel(target);
  }

  overwriteResult(target, result) {
    return this.handler.overwriteResult(target, result);
  }

  setSelected(segmentationKey, target) {
    return this.handler.setSelected(segmentationKey, target);
  }

  static getInstance() {
    return instance || (instance = new FederatedInternalsBrowserProxy());
  }

  getCallbackRouter() {
    return this.callbackRouter;
  }
}

let instance = null;