#!/bin/bash
set -e -x

apt-get install -y postgresql postgresql-contrib
cp /vagrant/vagrant/*.conf /etc/postgresql/9.3/main
service postgresql restart
