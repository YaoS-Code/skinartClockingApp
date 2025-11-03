#!/bin/bash

# 快速配置 Docker 环境的脚本
# 在项目目录下运行: source docker_env.sh

# 配置 Homebrew 路径（Apple Silicon）
if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# 配置 Docker/Colima
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock" 2>/dev/null || true

echo "✓ Docker 环境已配置"
echo "Docker 版本: $(docker --version 2>/dev/null || echo '未安装')"
echo "Colima 状态: $(colima status 2>/dev/null | grep -o 'running\|not running' || echo '未安装')"



