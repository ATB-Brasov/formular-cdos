{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/nixos-25.11.tar.gz") {} }: 

with pkgs; mkShell {
  buildInputs = [
    svelte-language-server
    tailwindcss-language-server
    typescript-language-server

    deno
    nodejs
    # nodejs_22

    stdenv.cc.cc.lib # Provides libstdc++.so.6
    gcc
    gnumake
  ];

  shellHook = ''
    export LD_LIBRARY_PATH="${stdenv.cc.cc.lib}/lib:$LD_LIBRARY_PATH"
    export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}

