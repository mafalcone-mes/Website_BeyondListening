# Beyond Listening — makes sure a recent Node.js is available (macOS / Linux).
# Sourced by the "Start/Stop Beyond Listening.command" files.
# If Node.js 20.9+ is not installed, a private copy is downloaded into .runtime/
# (no administrator password needed, nothing is installed system-wide).

NODE_LINE="latest-v24.x"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
BL_RUNTIME="$PWD/.runtime"

bl_node_ok() {
  "$1" -v 2>/dev/null | awk -F'[v.]' '{ exit !(($2 > 20) || ($2 == 20 && $3 >= 9)) }'
}

bl_ensure_node() {
  if command -v node >/dev/null 2>&1 && bl_node_ok "$(command -v node)"; then
    return 0
  fi
  if [ -x "$BL_RUNTIME/node/bin/node" ] && bl_node_ok "$BL_RUNTIME/node/bin/node"; then
    export PATH="$BL_RUNTIME/node/bin:$PATH"
    return 0
  fi

  echo "Downloading Node.js (one time, about 50 MB)..."
  mkdir -p "$BL_RUNTIME"
  case "$(uname -s)" in
    Darwin) os=darwin ;;
    Linux) os=linux ;;
    *) echo "This system is not supported."; return 1 ;;
  esac
  case "$(uname -m)" in
    arm64 | aarch64) arch=arm64 ;;
    x86_64) arch=x64 ;;
    *) echo "This processor is not supported."; return 1 ;;
  esac

  base="https://nodejs.org/dist/$NODE_LINE"
  line=$(curl -fsSL "$base/SHASUMS256.txt" | grep -E "node-v[0-9.]+-$os-$arch\.tar\.gz$" | head -n 1)
  if [ -z "$line" ]; then
    echo "Could not reach nodejs.org. Check your internet connection and try again."
    return 1
  fi
  hash=${line%% *}
  file=${line##* }

  curl -fL --progress-bar "$base/$file" -o "$BL_RUNTIME/$file" || return 1
  if command -v shasum >/dev/null 2>&1; then
    actual=$(shasum -a 256 "$BL_RUNTIME/$file" | awk '{print $1}')
  else
    actual=$(sha256sum "$BL_RUNTIME/$file" | awk '{print $1}')
  fi
  if [ "$actual" != "$hash" ]; then
    echo "The download could not be verified. Please try again."
    rm -f "$BL_RUNTIME/$file"
    return 1
  fi

  rm -rf "$BL_RUNTIME/node"
  tar -xzf "$BL_RUNTIME/$file" -C "$BL_RUNTIME" || return 1
  mv "$BL_RUNTIME/${file%.tar.gz}" "$BL_RUNTIME/node"
  rm -f "$BL_RUNTIME/$file"
  export PATH="$BL_RUNTIME/node/bin:$PATH"
  echo "Node.js is ready."
}
