"""Package only the public USB build for ESP Web Tools after compilation."""
import hashlib
import json
from pathlib import Path
import subprocess

Import("env")


def package_firmware(source, target, env):
    if "PUBLIC_USB_FIRMWARE" not in env.subst("$BUILD_FLAGS"):
        raise RuntimeError("Web firmware must exclude private Wi-Fi credentials")
    output = Path(env.subst("$PROJECT_DIR")) / "data" / "firmware"
    output.mkdir(parents=True, exist_ok=True)
    binary = output / "esp32-usb-1.1.0.bin"
    esptool = Path(env.PioPlatform().get_package_dir("tool-esptoolpy")) / "esptool.py"
    command = [env.subst("$PYTHONEXE"), str(esptool), "--chip", "esp32",
               "merge_bin", "-o", str(binary), "--flash_mode", "dio",
               "--flash_freq", "40m", "--flash_size", "4MB"]
    for offset, path in env.get("FLASH_EXTRA_IMAGES", []):
        command.extend([str(offset), env.subst(str(path))])
    command.extend([env.subst("$ESP32_APP_OFFSET"), str(target[0])])
    subprocess.run(command, check=True)
    manifest = {
        "name": "ESP32 Sensor Dashboard USB",
        "version": "1.1.0",
        "new_install_prompt_erase": True,
        "new_install_improv_wait_time": 0,
        "builds": [{"chipFamily": "ESP32", "parts": [
            {"path": binary.name, "offset": 0}
        ]}]
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    digest = hashlib.sha256(binary.read_bytes()).hexdigest()
    (output / "SHA256SUMS").write_text(f"{digest}  {binary.name}\n", encoding="ascii")
    print(f"Browser firmware packaged: {binary}")


env.AddPostAction("$BUILD_DIR/${PROGNAME}.bin", package_firmware)
