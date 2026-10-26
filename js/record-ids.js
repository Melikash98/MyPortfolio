function createRecordDomId(collectionName, documentId) {
  const encodePart = (value) => encodeURIComponent(String(value));
  return `${encodePart(collectionName)}-${encodePart(documentId)}`;
}

function assignRecordFieldDomIds(record, recordDomId) {
  const selector = '[data-record-field]';
  const fields = [];

  if (record instanceof Element && record.matches(selector)) {
    fields.push(record);
  }

  if (record.querySelectorAll) {
    fields.push(...record.querySelectorAll(selector));
  }

  fields.forEach((field) => {
    const fieldName = field.dataset.recordField;
    if (fieldName) {
      field.id = `${recordDomId}--${encodeURIComponent(fieldName)}`;
    }
  });
}

function assignRecordDomId(element, collectionName, documentId) {
  if (!(element instanceof Element) || collectionName == null || documentId == null || String(documentId) === '') {
    return null;
  }

  const id = createRecordDomId(collectionName, documentId);
  element.id = id;
  element.dataset.recordCollection = String(collectionName);
  element.dataset.recordDocumentId = String(documentId);
  assignRecordFieldDomIds(element, id);
  return id;
}

function hydrateRecordDomIds(root = document) {
  const selector = '[data-record-collection][data-record-document-id]';
  const records = [];

  if (root instanceof Element && root.matches(selector)) {
    records.push(root);
  }

  if (root.querySelectorAll) {
    records.push(...root.querySelectorAll(selector));
  }

  records.forEach((record) => {
    assignRecordDomId(
      record,
      record.dataset.recordCollection,
      record.dataset.recordDocumentId
    );
  });

  if (root instanceof Element) {
    const parentRecord = root.closest(selector);
    if (parentRecord) {
      assignRecordFieldDomIds(parentRecord, parentRecord.id);
    }
  }
}

function observeRecordDomIds() {
  if (!document.body) {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          hydrateRecordDomIds(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function initializeRecordDomIds() {
  hydrateRecordDomIds();
  observeRecordDomIds();
}

window.assignRecordDomId = assignRecordDomId;
window.hydrateRecordDomIds = hydrateRecordDomIds;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRecordDomIds);
} else {
  initializeRecordDomIds();
}
