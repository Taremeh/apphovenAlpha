import * as dialogsModule from "ui/dialogs";

export function alert(message: string) {
  return dialogsModule.alert({
    title: "Apphoven",
    okButtonText: "OK",
    message: message
  });
}

export function alertExt(title: string, message: string, okButtonText?: string) {
  return dialogsModule.alert({
    title: title,
    okButtonText: okButtonText || "OK",
    message: message
  });
}