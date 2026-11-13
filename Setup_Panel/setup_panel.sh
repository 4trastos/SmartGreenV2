#!/bin/bash
# =============================================================================
# setup_panel.sh — Configuración de un panel IXHUB (RK3568, Ubuntu 22.04)
# para SmartGreen / Australair Connect.
#
# Requisitos previos:
#   1. El panel tiene red (WiFi o cable) para instalar paquetes.
#   2. El código ya está copiado desde el portátil en:
#        /home/pi/smartgreen_new/Sotfware
#      (rsync -av --exclude '*.o' --exclude '/smartgreen' --exclude node_modules \
#         ./ teamhd@IP_PANEL:/home/pi/smartgreen_new/Sotfware/)
#      Si /home/pi no existe todavía, ejecuta antes en el panel:
#        sudo mkdir -p /home/pi/smartgreen_new/Sotfware && sudo chown -R teamhd:teamhd /home/pi
#
# Uso (en el panel, como usuario teamhd, NO como root):
#   bash setup_panel.sh          -> pantalla de 10,1" (escala 1.6)
#   bash setup_panel.sh 1.28     -> pantalla de 7"    (escala 1.28)
#
# Al terminar: sudo reboot
# =============================================================================
set -e

SCALE="${1:-1.6}"
APP_DIR="/home/pi/smartgreen_new/Sotfware"
APP_BIN="$APP_DIR/smartgreen"
DATA_DIR="/userdata/smartgreen"
RS485_TTY="ttyS5"            # COM5 del panel IXHUB

if [ "$(id -u)" -eq 0 ]; then
    echo "ERROR: ejecútalo como el usuario del panel (teamhd), no como root."
    exit 1
fi
if [ ! -f "$APP_DIR/Makefile" ]; then
    echo "ERROR: no encuentro el código en $APP_DIR. Cópialo antes con rsync."
    exit 1
fi

echo "== 1. Partición de datos /userdata =="
sudo mkdir -p /userdata
if ! grep -q " /userdata " /etc/fstab; then
    echo 'LABEL=userdata /userdata ext4 defaults,noatime 0 2' | sudo tee -a /etc/fstab
fi
sudo mount -a
sudo mkdir -p "$DATA_DIR"

echo "== 2. Enlace de la base de datos =="
if [ ! -e /var/lib/smartgreen ]; then
    sudo ln -s "$DATA_DIR" /var/lib/smartgreen
fi
sudo mkdir -p /home/pi
sudo chown "$USER:$USER" /home/pi

echo "== 3. Idioma y zona horaria =="
sudo locale-gen en_GB.UTF-8 es_ES.UTF-8
sudo timedatectl set-timezone Europe/Madrid

echo "== 4. Librerías de SmartGreen =="
HOLD_PKGS="libssl3 libsqlite3-0 libcurl4 libgnutls30 gcc-11-base gcc-12-base cpp-11 libcap2 libp11-kit0 libtasn1-6 curl libatomic1 libgcc-s1 libgfortran5 libgomp1 libstdc++6 p11-kit-modules"
sudo apt-mark unhold $HOLD_PKGS
sudo apt update
sudo apt install -y build-essential sqlite3 libmodbus-dev libsqlite3-dev libmicrohttpd-dev \
    libwebsockets-dev libssl-dev libcurl4-openssl-dev libjson-c-dev $HOLD_PKGS

echo "== 5. Compilar SmartGreen =="
cd "$APP_DIR"
make clean
make
cd - > /dev/null

echo "== 6. Puerto RS-485 (/dev/ttyRS485 -> $RS485_TTY) =="
echo "KERNEL==\"$RS485_TTY\", SYMLINK+=\"ttyRS485\", GROUP=\"dialout\", MODE=\"0660\"" \
    | sudo tee /etc/udev/rules.d/99-rs485.rules
sudo udevadm control --reload
sudo udevadm trigger --action=add --subsystem-match=tty
sudo udevadm settle

echo "== 7. Servicio smartgreen-app =="
sudo tee /etc/systemd/system/smartgreen-app.service > /dev/null <<EOF
[Unit]
Description=SmartGreen by Australair
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/stdbuf -oL -eL $APP_BIN
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable smartgreen-app

echo "== 8. Kiosko Chromium (escala $SCALE) =="
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/smartgreen-kiosk.desktop <<EOF
[Desktop Entry]
Type=Application
Name=SmartGreen kiosk
Exec=sh -c 'xset s off -dpms s noblank; until curl -s http://localhost:8080 >/dev/null; do sleep 1; done; chromium --kiosk --force-device-scale-factor=$SCALE --noerrdialogs --disable-infobars --no-first-run --disable-features=Translate --password-store=basic http://localhost:8080'
X-GNOME-Autostart-enabled=true
EOF

echo "== 9. Sin puntero del ratón =="
printf '[Seat:*]\nxserver-command=X -nocursor\n' | sudo tee /etc/lightdm/lightdm.conf.d/30-nocursor.conf

echo "== 10. Sin avisos del sistema ni dock =="
for f in nm-applet update-notifier blueman plank; do
    if [ -f "/etc/xdg/autostart/$f.desktop" ]; then
        printf '[Desktop Entry]\nHidden=true\n' > ~/.config/autostart/$f.desktop
        echo "desactivado $f"
    fi
done
mkdir -p ~/.config/xfce4/xfconf/xfce-perchannel-xml
cat > ~/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-notifyd.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-notifyd" version="1.0">
  <property name="do-not-disturb" type="bool" value="true"/>
</channel>
EOF

echo "== 11. Sesión sin escritorio ni barra =="
cat > ~/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-session.xml <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-session" version="1.0">
  <property name="general" type="empty">
    <property name="FailsafeSessionName" type="string" value="Failsafe"/>
    <property name="SaveOnExit" type="bool" value="false"/>
  </property>
  <property name="sessions" type="empty">
    <property name="Failsafe" type="empty">
      <property name="IsFailsafe" type="bool" value="true"/>
      <property name="Count" type="int" value="2"/>
      <property name="Client0_Command" type="array"><value type="string" value="xfwm4"/></property>
      <property name="Client0_PerScreen" type="bool" value="false"/>
      <property name="Client1_Command" type="array"><value type="string" value="xfsettingsd"/></property>
      <property name="Client1_PerScreen" type="bool" value="false"/>
    </property>
  </property>
</channel>
EOF
rm -rf ~/.cache/sessions/*

echo
echo "============================================================"
echo " Configuración terminada. Reinicia el panel: sudo reboot"
echo " Después cambia la contraseña de fábrica: passwd"
echo "============================================================"
