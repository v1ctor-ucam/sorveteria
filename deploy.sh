cd /opt/sorveteria-api/repo && git config --global advice.detachedHead false && git fetch --all && git reset --hard origin/main
mkdir -p /var/www/sorveteria
rm -rf /var/www/sorveteria/*
cp -r web/dist/web/browser/* /var/www/sorveteria/
chmod -R 755 /var/www/sorveteria

cat << 'EOF' > /etc/nginx/sites-available/sorveteria
server {
    listen 80;
    server_name _;

    root /var/www/sorveteria;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/sorveteria /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

cat << 'EOF' > /etc/systemd/system/sorveteria-api.service
[Unit]
Description=Sorveteria API - .NET 8
After=network.target

[Service]
WorkingDirectory=/opt/sorveteria-api/publish
ExecStart=/usr/bin/dotnet /opt/sorveteria-api/publish/Sorveteria.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=sorveteria-api
User=root
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://*:5000

[Install]
WantedBy=multi-user.target
EOF

cd /opt/sorveteria-api/repo/backend/Sorveteria.Api
dotnet publish -c Release -o /opt/sorveteria-api/publish
sed -i "s/Database=sorveteria_fideliza;/Database=sorveteria_fideliza_db;/" /opt/sorveteria-api/publish/appsettings.json
sed -i "s/Uid=root;/User=admin;/" /opt/sorveteria-api/publish/appsettings.json
sed -i "s/Pwd=;/Pwd=84153703cC!;/" /opt/sorveteria-api/publish/appsettings.json

systemctl daemon-reload
systemctl enable sorveteria-api
systemctl restart sorveteria-api
systemctl status sorveteria-api -n 20 --no-pager