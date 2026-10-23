"""Keep downloadable firmware out of the ESP32's small LittleFS partition."""
from pathlib import Path
import shutil
from SCons.Script import COMMAND_LINE_TARGETS

Import("env")

if {"buildfs", "uploadfs", "uploadfsota"}.intersection(COMMAND_LINE_TARGETS):
    source = Path(env.subst("$PROJECT_DIR")) / "data"
    staging = Path(env.subst("$BUILD_DIR")) / "filesystem-data"
    staging.mkdir(parents=True, exist_ok=True)
    # Synchronize only this dedicated build directory, including removed assets.
    for existing in staging.rglob("*"):
        if existing.is_file() and not (source / existing.relative_to(staging)).is_file():
            existing.unlink()
    shutil.copytree(source, staging, dirs_exist_ok=True, ignore=shutil.ignore_patterns("firmware"))
    env.Replace(PROJECT_DATA_DIR=str(staging))
