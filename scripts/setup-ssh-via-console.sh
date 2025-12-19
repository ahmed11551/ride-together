#!/bin/bash
# Команды для настройки SSH через веб-консоль REG.RU
# Скопируйте эти команды и выполните в веб-консоли

cat <<'EOF'
╔════════════════════════════════════════════════════════════╗
║  🔧 Команды для настройки SSH через веб-консоль           ║
╚════════════════════════════════════════════════════════════╝

📋 Скопируйте и выполните эти команды в веб-консоли REG.RU:

─────────────────────────────────────────────────────────────

# 1. Обновите систему
apt-get update

# 2. Установите SSH сервер
apt-get install -y openssh-server

# 3. Запустите SSH
systemctl start ssh
systemctl enable ssh

# 4. Проверьте статус SSH
systemctl status ssh

# 5. Установите и настройте firewall
apt-get install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 6. Добавьте SSH ключ
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPBZgLzT/nx4lZWq5mNUT9ATYlskW1Sc8VKEojtR+Qvt ride-together-regru-20251218" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 7. Проверьте, что порт 22 открыт
netstat -tlnp | grep 22

─────────────────────────────────────────────────────────────

✅ После выполнения этих команд:
   1. Попробуйте подключиться через терминал:
      ssh root@194.67.124.123

   2. Затем запустите автоматическую настройку:
      cd /Users/ahmeddevops/Desktop/ride/ride-together
      ./scripts/quick-setup-regru.sh 194.67.124.123 root

EOF

