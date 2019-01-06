server {
listen 80 default_server;
server_name YOURDOMAIN.HERE;
location / {
#auth_basic "Restricted Content";
#auth_basic_user_file /home/your/basic/auth/passwd_file;
proxy_pass http://localhost:3000; #or any port number here
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
proxy_cache_bypass \$http_upgrade;
}
}
