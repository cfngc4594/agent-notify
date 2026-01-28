#!/usr/bin/env bash
set -euo pipefail

# Colors (only if terminal)
Color_Off=''
Red=''
Green=''
Dim=''
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
  Color_Off='\033[0m'
  Red='\033[0;31m'
  Green='\033[0;32m'
  Dim='\033[0;2m'
  Bold_Green='\033[1;32m'
  Bold_White='\033[1m'
fi

error() {
  echo -e "${Red}error${Color_Off}:" "$@" >&2
  exit 1
}

info() {
  echo -e "${Dim}$@${Color_Off}"
}

info_bold() {
  echo -e "${Bold_White}$@${Color_Off}"
}

success() {
  echo -e "${Green}$@${Color_Off}"
}

tildify() {
  if [[ $1 = $HOME/* ]]; then
    local replacement=\~/
    echo "${1/$HOME\//$replacement}"
  else
    echo "$1"
  fi
}

# Check if macOS
if [[ $(uname) != "Darwin" ]]; then
  error "agent-notify only supports macOS"
fi

# Detect architecture
case $(uname -m) in
  arm64)
    target="agent-notify-arm64"
    ;;
  x86_64)
    target="agent-notify-x64"
    ;;
  *)
    error "Unsupported architecture: $(uname -m)"
    ;;
esac

# GitHub repo
github_repo="https://github.com/cfngc4594/agent-notify"
download_uri="$github_repo/releases/latest/download/$target"

# Install location
install_dir="$HOME/.local/bin"
exe="$install_dir/agent-notify"

if [[ ! -d $install_dir ]]; then
  mkdir -p "$install_dir" ||
    error "Failed to create install directory \"$install_dir\""
fi

curl --fail --location --progress-bar --output "$exe" "$download_uri" ||
  error "Failed to download agent-notify from \"$download_uri\""

chmod +x "$exe" ||
  error "Failed to set permissions on agent-notify executable"

success "agent-notify was installed successfully to $Bold_Green$(tildify "$exe")"

if command -v agent-notify >/dev/null; then
  echo "Run 'agent-notify' to get started"
  exit
fi

refresh_command=''
tilde_bin_dir=$(tildify "$install_dir")

echo

case $(basename "$SHELL") in
  zsh)
    commands=(
      "export PATH=\"$install_dir:\$PATH\""
    )
    zsh_config=$HOME/.zshrc
    tilde_zsh_config=$(tildify "$zsh_config")

    if [[ -w $zsh_config ]]; then
      {
        echo -e '\n# agent-notify'
        for command in "${commands[@]}"; do
          echo "$command"
        done
      } >>"$zsh_config"

      info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_zsh_config\""
      refresh_command="exec $SHELL"
    else
      echo "Manually add the directory to $tilde_zsh_config (or similar):"
      for command in "${commands[@]}"; do
        info_bold "  $command"
      done
    fi
    ;;
  bash)
    commands=(
      "export PATH=\"$install_dir:\$PATH\""
    )
    bash_configs=(
      "$HOME/.bashrc"
      "$HOME/.bash_profile"
    )
    set_manually=true

    for bash_config in "${bash_configs[@]}"; do
      tilde_bash_config=$(tildify "$bash_config")

      if [[ -w $bash_config ]]; then
        {
          echo -e '\n# agent-notify'
          for command in "${commands[@]}"; do
            echo "$command"
          done
        } >>"$bash_config"

        info "Added \"$tilde_bin_dir\" to \$PATH in \"$tilde_bash_config\""
        refresh_command="source $bash_config"
        set_manually=false
        break
      fi
    done

    if [[ $set_manually = true ]]; then
      echo "Manually add the directory to ~/.bashrc (or similar):"
      for command in "${commands[@]}"; do
        info_bold "  $command"
      done
    fi
    ;;
  *)
    echo "Manually add the directory to ~/.bashrc (or similar):"
    info_bold "  export PATH=\"$install_dir:\$PATH\""
    ;;
esac

echo
info "To get started, run:"
echo

if [[ $refresh_command ]]; then
  info_bold "  $refresh_command"
fi

info_bold "  agent-notify"
