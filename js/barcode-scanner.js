// ── Barcode Scanner Component (Reusable) ───────────────────────────────────
// Uses html5-qrcode library loaded via CDN
// Supports: EAN-13, EAN-8, UPC-A, CODE-128
// Modes: single (closes after scan), continuous (stays open)

var BarcodeScanner = (function () {

  var scanner = null;
  var isScanning = false;
  var currentMode = "single"; // "single" or "continuous"
  var onScanCallback = null;
  var onCloseCallback = null;
  var modalEl = null;
  var scannerContainerId = "barcode-scanner-reader";
  var lastScannedCode = "";
  var lastScanTime = 0;
  var DEBOUNCE_MS = 1500; // prevent double-scan of same code

  // ── Build the scanner modal HTML ──────────────────────────────────────
  function createModal() {
    if (document.getElementById("barcode-scanner-modal")) {
      modalEl = document.getElementById("barcode-scanner-modal");
      return;
    }

    var overlay = document.createElement("div");
    overlay.id = "barcode-scanner-modal";
    overlay.className = "scanner-modal-overlay";
    overlay.innerHTML =
      '<div class="scanner-modal">'
      + '  <div class="scanner-modal-header">'
      + '    <h3 id="scanner-modal-title">📷 Scan Barcode</h3>'
      + '    <button class="modal-close" id="scanner-close-btn" title="Close Scanner">✕</button>'
      + '  </div>'
      + '  <div class="scanner-viewport">'
      + '    <div id="' + scannerContainerId + '"></div>'
      + '    <div class="scanner-guide">'
      + '      <div class="scanner-guide-corner tl"></div>'
      + '      <div class="scanner-guide-corner tr"></div>'
      + '      <div class="scanner-guide-corner bl"></div>'
      + '      <div class="scanner-guide-corner br"></div>'
      + '      <div class="scanner-laser"></div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="scanner-status" id="scanner-status">'
      + '    <span class="scanner-status-dot"></span>'
      + '    <span id="scanner-status-text">Initializing camera…</span>'
      + '  </div>'
      + '  <div class="scanner-last-scan" id="scanner-last-scan" style="display:none">'
      + '    <span class="scanner-last-label">Last scanned:</span>'
      + '    <span class="scanner-last-code" id="scanner-last-code"></span>'
      + '  </div>'
      + '  <div class="scanner-actions">'
      + '    <button class="btn btn-outline" id="scanner-cancel-btn">Cancel</button>'
      + '  </div>'
      + '</div>';

    document.body.appendChild(overlay);
    modalEl = overlay;

    // Bind close/cancel
    document.getElementById("scanner-close-btn").addEventListener("click", close);
    document.getElementById("scanner-cancel-btn").addEventListener("click", close);

    // Close on overlay click
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
  }

  // ── Open scanner ──────────────────────────────────────────────────────
  function open(options) {
    // options: { mode: "single"|"continuous", onScan: fn(code), onClose: fn(), title: string }
    options = options || {};
    currentMode = options.mode || "single";
    onScanCallback = options.onScan || function () {};
    onCloseCallback = options.onClose || function () {};

    createModal();

    // Update title
    var titleEl = document.getElementById("scanner-modal-title");
    if (options.title) {
      titleEl.textContent = "📷 " + options.title;
    } else {
      titleEl.textContent = currentMode === "continuous" ? "📷 Continuous Scan" : "📷 Scan Barcode";
    }

    // Reset state
    var lastScanEl = document.getElementById("scanner-last-scan");
    if (lastScanEl) lastScanEl.style.display = "none";
    updateStatus("Initializing camera…", false);

    // Show modal
    modalEl.classList.add("open");

    // Start scanner
    startScanner();
  }

  // ── Start the html5-qrcode scanner ────────────────────────────────────
  function startScanner() {
    if (typeof Html5Qrcode === "undefined") {
      updateStatus("Error: Scanner library not loaded.", true);
      return;
    }

    scanner = new Html5Qrcode(scannerContainerId);
    isScanning = true;

    var config = {
      fps: 10,
      qrbox: { width: 280, height: 150 },
      aspectRatio: 1.5,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.CODE_128
      ]
    };

    scanner.start(
      { facingMode: "environment" }, // prefer rear camera
      config,
      function onSuccess(decodedText) {
        handleScan(decodedText);
      },
      function onError() {
        // Scan frame error — ignore (expected when no barcode in frame)
      }
    ).then(function () {
      updateStatus("Scanner active — point at a barcode", false);
    }).catch(function (err) {
      console.error("Camera start error:", err);
      var errMsg = String(err);
      if (errMsg.indexOf("NotAllowedError") !== -1 || errMsg.indexOf("Permission") !== -1) {
        updateStatus("Camera access denied. Please allow camera permission and try again.", true);
      } else if (errMsg.indexOf("NotFoundError") !== -1) {
        updateStatus("No camera found on this device.", true);
      } else {
        updateStatus("Camera error: " + errMsg, true);
      }
      isScanning = false;
    });
  }

  // ── Handle a successful scan ──────────────────────────────────────────
  function handleScan(code) {
    var now = Date.now();
    // debounce repeated scans of the same code
    if (code === lastScannedCode && (now - lastScanTime) < DEBOUNCE_MS) return;
    lastScannedCode = code;
    lastScanTime = now;

    // Show last scanned code
    var lastScanEl = document.getElementById("scanner-last-scan");
    var lastCodeEl = document.getElementById("scanner-last-code");
    if (lastScanEl && lastCodeEl) {
      lastCodeEl.textContent = code;
      lastScanEl.style.display = "flex";
    }

    // Invoke callback
    if (onScanCallback) onScanCallback(code);

    // In single mode, close after scanning
    if (currentMode === "single") {
      close();
    } else {
      // In continuous mode, show a brief flash effect
      updateStatus("✓ Scanned: " + code, false);
    }
  }

  // ── Close scanner ─────────────────────────────────────────────────────
  function close() {
    if (scanner && isScanning) {
      scanner.stop().then(function () {
        scanner.clear();
        scanner = null;
        isScanning = false;
      }).catch(function () {
        scanner = null;
        isScanning = false;
      });
    } else {
      scanner = null;
      isScanning = false;
    }

    if (modalEl) {
      modalEl.classList.remove("open");
    }

    lastScannedCode = "";
    lastScanTime = 0;

    if (onCloseCallback) onCloseCallback();
  }

  // ── Update status line ────────────────────────────────────────────────
  function updateStatus(text, isError) {
    var statusText = document.getElementById("scanner-status-text");
    var statusDot = document.querySelector(".scanner-status-dot");
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.style.background = isError ? "var(--red)" : "var(--mint-main)";
    }
  }

  // ── Public API ────────────────────────────────────────────────────────
  return {
    open: open,
    close: close,
    isActive: function () { return isScanning; }
  };

})();
