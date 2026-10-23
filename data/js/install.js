const installer = document.getElementById("firmware-installer");
const status = document.getElementById("install-status");

if (!window.isSecureContext || !("serial" in navigator)) {
    status.textContent = "USB installation requires desktop Chrome or Edge on HTTPS or localhost.";
}
else {
    try {
        // Keep installation separate from the dashboard's serial reader.
        const response = await fetch(installer.getAttribute("manifest"), { cache: "no-store" });
        if (!response.ok) throw new Error("Firmware manifest unavailable");
        const manifest = await response.json();
        if (!manifest.builds?.some(build => build.chipFamily === "ESP32" && build.parts?.length)) {
            throw new Error("No ESP32 firmware build available");
        }
        await import("https://unpkg.com/esp-web-tools@10.1.0/dist/web/install-button.js?module");
        await customElements.whenDefined("esp-web-install-button");
        installer.hidden = false;
        status.textContent = "Ready to install · USB firmware 1.1.0";
    }
    catch (error) {
        console.error("Firmware installer unavailable:", error);
        status.textContent = "Installer could not load. Refresh to retry and check your internet connection. The site must include the firmware files.";
    }
}
