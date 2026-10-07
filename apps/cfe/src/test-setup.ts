// Runs before every spec file (angular.json: test.options.setupFiles).

// jsdom has <dialog> but not its methods. Emulate the parts cui-modal relies on: the `open`
// attribute, and a `close` event when the dialog closes.
const dialogPrototype = HTMLDialogElement.prototype;
if (!dialogPrototype.showModal) {
  dialogPrototype.show = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  dialogPrototype.showModal = dialogPrototype.show;
  dialogPrototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) {
      return;
    }
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
