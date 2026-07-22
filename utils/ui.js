import { EMPTY } from "../lib/config.js";
import { icon } from "./icons.js";

export function emptyMarkup(text = EMPTY) {
  return `<div class="empty-state">${text}</div>`;
}

export function actionButtons(type, id, duplicate = true) {
  return `
    <div class="action-group">
      <button class="icon-button" data-edit="${type}" data-id="${id}" aria-label="Editar" title="Editar">${icon("edit")}</button>
      ${duplicate ? `<button class="icon-button" data-duplicate="${type}" data-id="${id}" aria-label="Duplicar" title="Duplicar">${icon("copy")}</button>` : ""}
      <button class="icon-button danger" data-delete="${type}" data-id="${id}" aria-label="Eliminar" title="Eliminar">${icon("trash")}</button>
    </div>
  `;
}
