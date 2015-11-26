#!/bin/bash
set -e -x

sudo sed -i 's/127.0.0.1 localhost/192.168.50.1 localhost/' /etc/hosts
curl -sL https://deb.nodesource.com/setup_5.x | bash -
apt-get install -y nodejs libpq-dev
cd /vagrant
npm install
