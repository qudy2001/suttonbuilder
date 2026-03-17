#!/usr/bin/env python3

import subprocess
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 5:
      print(
          "Usage: launch_admin.py <project_root> <log_file> <host> <port>",
          file=sys.stderr,
      )
      return 1

    project_root, log_file, host, port = sys.argv[1:]

    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    admin_script = Path(__file__).with_name("admin_server.py")

    with log_path.open("ab", buffering=0) as log_handle:
      process = subprocess.Popen(
          [sys.executable, str(admin_script), host, port],
          cwd=project_root,
          stdin=subprocess.DEVNULL,
          stdout=log_handle,
          stderr=subprocess.STDOUT,
          start_new_session=True,
          close_fds=True,
      )

    print(process.pid)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
