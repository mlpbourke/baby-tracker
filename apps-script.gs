const SHEET_NAME = "Sheet1";
const HEADERS = [
  "ID", "Time", "Type", "Details", "Amount", "Duration (min)",
  "Unit", "Value", "Text", "Status", "JSON"
];

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No active spreadsheet. Use this as a spreadsheet-bound Apps Script project.");
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function doGet(e) {
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return jsonResponse({ result: "success", events: [] });
    }

    // Read only column K, where the complete JSON record is stored.
    const jsonCells = sheet.getRange(2, 11, lastRow - 1, 1).getDisplayValues();
    const events = [];

    for (let i = 0; i < jsonCells.length; i++) {
      const raw = jsonCells[i][0];
      if (!raw) continue;

      try {
        const item = JSON.parse(raw);
        if (item && item.id) events.push(item);
      } catch (parseError) {
        console.warn(`Skipping invalid JSON in row ${i + 2}: ${parseError}`);
      }
    }

    return jsonResponse({ result: "success", events: events });
  } catch (error) {
    console.error(error);
    return jsonResponse({ result: "error", error: String(error) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Missing POST body.");
    }

    const data = JSON.parse(e.postData.contents);

    if (data.type === "ping") {
      return jsonResponse({ result: "success" });
    }

    if (!data.id || typeof data.id !== "string") {
      throw new Error("Every record must have a string id.");
    }

    // waitLock throws if the lock cannot be acquired. This prevents two
    // simultaneous phones from overwriting or appending at the same time.
    lock.waitLock(20000);
    hasLock = true;

    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    let rowIndex = -1;

    if (lastRow >= 2) {
      const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      for (let i = 0; i < idValues.length; i++) {
        if (idValues[i][0] === data.id) {
          rowIndex = i + 2;
          break;
        }
      }
    }

    const eventTime = data.ts ? new Date(Number(data.ts)) : new Date();
    const validEventTime = !isNaN(eventTime.getTime()) ? eventTime : new Date();

    const rowData = [
      data.id,
      validEventTime,
      data.type || "",
      data.feedType || data.contents || "",
      data.amount !== undefined ? data.amount : "",
      data.durationMin !== undefined ? data.durationMin : "",
      data.unit || "",
      data.value !== undefined ? data.value : "",
      data.text || "",
      data.deleted ? "DELETED" : "ACTIVE",
      JSON.stringify(data)
    ];

    if (rowIndex !== -1) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    SpreadsheetApp.flush();
    return jsonResponse({ result: "success", id: data.id });
  } catch (error) {
    console.error(error);
    return jsonResponse({ result: "error", error: String(error) });
  } finally {
    if (hasLock && lock.hasLock()) {
      lock.releaseLock();
    }
  }
}
